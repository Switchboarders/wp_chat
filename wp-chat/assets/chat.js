/* WP Chat widget. Talks directly to the switchboard-chat backend; nothing is stored locally.
 *
 * Backend contract. The session token returned by /web/session is kept in this script's memory and, so
 * that a reload or another page of the site keeps the chat, in the browser's sessionStorage (this tab) or
 * localStorage (cfg.remember === 'browser'). It is sent as `Authorization: Bearer <token>` (no cookie, so browsers that block third-party
 * cookies work). A server older than switchboard-chat's token mode returns no token and sets a
 * cookie instead: the widget then falls back to cookies + EventSource.
 *   POST /web/session  -> 200 {"resumed":false,"token":"…"}   create session
 *   POST /web/message  {text}  -> 200 {}                       visitor message
 *   GET  /web/stream   -> SSE events: message {text} (with id: <seq>), typing {}, closed {};
 *                         the Last-Event-ID header resumes after the last line already shown
 *   GET  /web/history  -> 200 {"messages":[{seq,from:"me"|"them",text}],"last":N}   restores the window
 *   POST /web/end      -> 200 {}                               end chat and delete
 */
(function () {
	'use strict';

	// Incremental parser of a text/event-stream: feed(chunk) calls onEvent(name, data) per event.
	function createSseParser(onEvent) {
		var buf = '', evt = 'message', data = '', id = '';
		return function (chunk) {
			buf += chunk;
			var lines = buf.split('\n');
			buf = lines.pop();
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i].replace(/\r$/, '');
				if (line === '') {
					if (data !== '') { onEvent(evt, data, id); }
					evt = 'message'; data = ''; id = '';
				} else if (line.charAt(0) !== ':') { // ":" lines are keep-alive comments
					var idx = line.indexOf(':');
					var field = idx < 0 ? line : line.slice(0, idx);
					var value = idx < 0 ? '' : line.slice(idx + 1).replace(/^ /, '');
					if (field === 'event') { evt = value; }
					else if (field === 'id') { id = value; }
					else if (field === 'data') { data += (data !== '' ? '\n' : '') + value; }
				}
			}
		};
	}
	window.WPChat = window.WPChat || {};
	window.WPChat.createSseParser = createSseParser;

	// SHA-256 of an ASCII string, as bytes. Used only for the proof-of-work challenge, so it is
	// synchronous (no crypto.subtle round trips) and works on pages that are not "secure contexts".
	var SHA_K = [
		0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
		0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
		0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
		0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
		0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
		0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
		0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
		0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
	];
	function sha256(text) {
		var len = text.length, total = ((len + 9 + 63) >> 6) << 6;
		var buf = new Uint8Array(total);
		for (var n = 0; n < len; n++) { buf[n] = text.charCodeAt(n) & 0xff; }
		buf[len] = 0x80;
		var view = new DataView(buf.buffer);
		view.setUint32(total - 8, Math.floor((len * 8) / 4294967296));
		view.setUint32(total - 4, (len * 8) >>> 0);
		var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
		var w = new Int32Array(64);
		for (var off = 0; off < total; off += 64) {
			var i, a, b;
			for (i = 0; i < 16; i++) { w[i] = view.getInt32(off + i * 4); }
			for (i = 16; i < 64; i++) {
				a = w[i - 15]; b = w[i - 2];
				w[i] = (w[i - 16] + (((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3)) + w[i - 7] +
					(((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10))) | 0;
			}
			var A = h[0], B = h[1], C = h[2], D = h[3], E = h[4], F = h[5], G = h[6], H = h[7];
			for (i = 0; i < 64; i++) {
				var t1 = (H + (((E >>> 6) | (E << 26)) ^ ((E >>> 11) | (E << 21)) ^ ((E >>> 25) | (E << 7))) +
					((E & F) ^ (~E & G)) + SHA_K[i] + w[i]) | 0;
				var t2 = ((((A >>> 2) | (A << 30)) ^ ((A >>> 13) | (A << 19)) ^ ((A >>> 22) | (A << 10))) +
					((A & B) ^ (A & C) ^ (B & C))) | 0;
				H = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0;
			}
			h[0] = (h[0] + A) | 0; h[1] = (h[1] + B) | 0; h[2] = (h[2] + C) | 0; h[3] = (h[3] + D) | 0;
			h[4] = (h[4] + E) | 0; h[5] = (h[5] + F) | 0; h[6] = (h[6] + G) | 0; h[7] = (h[7] + H) | 0;
		}
		var out = new Uint8Array(32);
		var ov = new DataView(out.buffer);
		for (var k = 0; k < 8; k++) { ov.setInt32(k * 4, h[k]); }
		return out;
	}
	function zeroBits(bytes) {
		var bits = 0;
		for (var i = 0; i < bytes.length; i++) {
			if (bytes[i] === 0) { bits += 8; continue; }
			var b = bytes[i];
			while ((b & 0x80) === 0) { bits++; b <<= 1; }
			break;
		}
		return bits;
	}
	// Finds a nonce so that SHA-256(challenge + ':' + nonce) starts with `bits` zero bits, in slices
	// of ~12 ms so the page stays responsive. Gives up after `limitMs`.
	function solvePow(challenge, bits, onDone, onFail, limitMs) {
		var nonce = 0, started = Date.now(), prefix = challenge + ':';
		(function slice() {
			var until = Date.now() + 12;
			while (Date.now() < until) {
				if (zeroBits(sha256(prefix + nonce)) >= bits) { onDone(String(nonce)); return; }
				nonce++;
			}
			if (Date.now() - started > limitMs) { onFail(); return; }
			setTimeout(slice, 0);
		})();
	}
	window.WPChat.sha256 = sha256;
	window.WPChat.zeroBits = zeroBits;
	window.WPChat.solvePow = solvePow;
	var cfg = window.WPChatConfig;
	var root = document.getElementById('wp-chat-root');
	if (!cfg || !root) { return; }
	// Language: the widget carries its texts in French and English and chooses in the visitor's
	// browser (mode 'auto'), so page caches and the site language do not matter.
	function pickLanguage(mode, siteLang, nav) {
		if (mode === 'fr' || mode === 'en') { return mode; }
		if (mode === 'auto' && nav) {
			var list = (nav.languages && nav.languages.length) ? nav.languages : [nav.language || nav.userLanguage];
			for (var i = 0; i < list.length; i++) {
				var primary = String(list[i] || '').toLowerCase().split('-')[0];
				if (primary === 'fr' || primary === 'en') { return primary; }
			}
		}
		return siteLang === 'fr' ? 'fr' : 'en';
	}
	var lang = pickLanguage(cfg.langMode, cfg.siteLang, window.navigator);
	var t = {};
	var base = cfg.strings[lang] || cfg.strings.en;
	Object.keys(base).forEach(function (k) { t[k] = base[k]; });
	// Texts customized by the administrator are shown as typed, in every language
	if (cfg.custom && cfg.custom.agentName) { t.agentName = cfg.custom.agentName; }
	if (cfg.custom && cfg.custom.retention) { t.retention = cfg.custom.retention; }
	root.lang = lang;
	var es = null, started = false, typingTimer = null;
	var token = null, ctrl = null, retries = 0, lastSeq = 0;

	function el(tag, cls, text) {
		var e = document.createElement(tag);
		if (cls) { e.className = cls; }
		if (text) { e.textContent = text; }
		return e;
	}

	function getHistory() {
		return fetch(cfg.backend + '/web/history', {
			headers: { Authorization: 'Bearer ' + token },
			credentials: 'omit'
		}).then(function (r) {
			if (!r.ok) { var err = new Error(String(r.status)); err.status = r.status; throw err; }
			return r.json();
		});
	}

	function api(path, body, extraHeaders) {
		var headers = { 'Content-Type': 'application/json' };
		if (extraHeaders) { Object.keys(extraHeaders).forEach(function (k) { headers[k] = extraHeaders[k]; }); }
		if (token) { headers.Authorization = 'Bearer ' + token; }
		return fetch(cfg.backend + path, {
			method: 'POST',
			// With a token no cookie is involved; without one (starting a session, or an older
			// server) the cookie fallback needs credentials.
			credentials: token ? 'omit' : 'include',
			headers: headers,
			body: JSON.stringify(body || {})
		}).then(function (r) {
			if (!r.ok) {
				// Keep the server's error code ("blocked", "no_respondent", "busy", "rate_limited", …)
				return r.json().catch(function () { return {}; }).then(function (b) {
					var err = new Error(String(r.status));
					err.status = r.status;
					err.code = b && b.error;
					err.body = b;
					throw err;
				});
			}
			return r.json().catch(function () { return {}; });
		});
	}

	// The chat survives a reload or a move to another page of the site: the session token (and whether the
	// window was open) is kept in the browser, in this tab only (sessionStorage, the default) or for the
	// whole browser (localStorage, up to the server's inactivity limit). It is erased when the chat ends.
	var SESSION_KEY = 'wpchat_session';
	function store() {
		try { return cfg.remember === 'browser' ? window.localStorage : window.sessionStorage; } catch (e) { return null; }
	}
	function loadSession() {
		try {
			var st = store();
			var v = st && JSON.parse(st.getItem(SESSION_KEY) || 'null');
			if (v && typeof v.token === 'string' && v.token) { return v; }
		} catch (e) { /* storage unavailable: no restored chat */ }
		return null;
	}
	function saveSession() {
		try {
			var st = store();
			if (st && token) { st.setItem(SESSION_KEY, JSON.stringify({ token: token, open: !win.hidden })); }
		} catch (e) { /* ignore */ }
	}
	function clearSession() {
		try { window.sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
		try { window.localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
	}

	root.style.setProperty('--wpc-color', cfg.color);

	var bubble = el('button', 'wpc-bubble');
	bubble.type = 'button';
	bubble.setAttribute('aria-label', t.open);
	bubble.textContent = '💬';

	var win = el('div', 'wpc-window');
	win.hidden = true;
	win.setAttribute('role', 'dialog');
	win.setAttribute('aria-label', t.title);

	var head = el('div', 'wpc-head');
	head.appendChild(el('span', 'wpc-title', t.agentName));
	var btnEnd = el('button', 'wpc-btn', t.end); btnEnd.type = 'button'; btnEnd.hidden = true;
	var btnMin = el('button', 'wpc-btn', '–'); btnMin.type = 'button';
	btnMin.setAttribute('aria-label', t.minimize);
	head.appendChild(btnEnd); head.appendChild(btnMin);

	var body = el('div', 'wpc-body');
	var consent = el('div', 'wpc-consent');
	consent.appendChild(el('p', '', t.consent));
	consent.appendChild(el('p', '', t.retention));
	if (cfg.officer) { consent.appendChild(el('p', '', t.officer + ' ' + cfg.officer)); }
	if (cfg.privacyUrl) {
		var a = el('a', '', t.policy); a.href = cfg.privacyUrl; a.target = '_blank'; a.rel = 'noopener';
		consent.appendChild(a);
	}
	var btnStart = el('button', 'wpc-start', t.start); btnStart.type = 'button';
	consent.appendChild(btnStart);

	var log = el('div', 'wpc-log'); log.hidden = true;
	var typing = el('div', 'wpc-typing'); typing.hidden = true;
	var form = el('form', 'wpc-form'); form.hidden = true;
	var input = el('input', 'wpc-input'); input.type = 'text'; input.maxLength = 1000;
	input.placeholder = t.placeholder; input.autocomplete = 'off';
	var btnSend = el('button', 'wpc-send', t.send); btnSend.type = 'submit';
	form.appendChild(input); form.appendChild(btnSend);

	body.appendChild(consent); body.appendChild(log); body.appendChild(typing);
	win.appendChild(head); win.appendChild(body); win.appendChild(form);
	root.appendChild(bubble); root.appendChild(win);

	function addMsg(text, mine) {
		var m = el('div', 'wpc-msg ' + (mine ? 'wpc-mine' : 'wpc-theirs'), text);
		log.appendChild(m);
		log.scrollTop = log.scrollHeight;
	}
	function notice(text) { log.appendChild(el('div', 'wpc-notice', text)); log.scrollTop = log.scrollHeight; }

	// The only thing this widget ever keeps in the browser, and only for a visitor a respondent has blocked:
	// a signed "blocked until" marker (two dates and a signature, no identifier). It is sent when a new
	// chat is requested, so changing network does not help a blocked browser.
	function storedMarker() {
		try {
			var m = JSON.parse(window.localStorage.getItem('wpchat_blocked') || 'null');
			if (m && m.marker && m.until * 1000 > Date.now()) { return m; }
			window.localStorage.removeItem('wpchat_blocked');
		} catch (e) { /* storage unavailable: nothing to do */ }
		return null;
	}
	function saveMarker(until, marker) {
		try { window.localStorage.setItem('wpchat_blocked', JSON.stringify({ until: until, marker: marker })); } catch (e) { /* ignore */ }
	}

	// Says what is wrong in words the visitor can act on; for "can't be served" cases it adds the
	// administrator's own text (for example another number to call).
	function showProblem(e) {
		var code = e && e.code;
		var text = code === 'blocked' ? t.blocked
			: code === 'no_respondent' ? t.unavailable
			: code === 'busy' ? t.busy
			: code === 'rate_limited' ? t.rate
			: t.error;
		notice(text);
		if (cfg.unavailableText && (code === 'blocked' || code === 'no_respondent' || code === 'busy')) {
			notice(cfg.unavailableText);
		}
	}

	function toggle(open) {
		win.hidden = !open;
		bubble.hidden = open;
		if (open && started) { input.focus(); }
		if (started) { saveSession(); }
	}

	function closeStream() {
		if (es) { es.close(); es = null; }
		if (ctrl) { ctrl.abort(); ctrl = null; }
	}

	function finish() {
		closeStream();
		clearSession();
		started = false;
		token = null;
		lastSeq = 0;
		form.hidden = true;
		btnEnd.hidden = true;
		notice(t.ended);
	}

	function onServerEvent(name, data, id) {
		if (name === 'message') {
			var seq = parseInt(id, 10);
			if (seq > 0) {
				if (seq <= lastSeq) { return; } // already shown (restored history, or a reconnection replay)
				lastSeq = seq;
			}
			typing.hidden = true;
			try { addMsg(JSON.parse(data).text, false); } catch (e) { /* ignore malformed */ }
		} else if (name === 'typing') {
			typing.textContent = t.agentName + ' ' + t.typing;
			typing.hidden = false;
			clearTimeout(typingTimer);
			typingTimer = setTimeout(function () { typing.hidden = true; }, 4000);
		} else if (name === 'banned') {
			try { var b = JSON.parse(data); saveMarker(b.until, b.marker); } catch (e) { /* ignore */ }
			clearSession();
			notice(t.blocked);
			if (cfg.unavailableText) { notice(cfg.unavailableText); }
		} else if (name === 'closed') {
			finish();
		}
	}

	// Live replies with fetch streaming, so the Authorization header can be sent (EventSource cannot).
	function openStream() {
		if (!token) { openLegacyStream(); return; }
		var gone = {};
		var mine = ctrl = new AbortController();
		fetch(cfg.backend + '/web/stream', {
			headers: lastSeq > 0
				? { Authorization: 'Bearer ' + token, Accept: 'text/event-stream', 'Last-Event-ID': String(lastSeq) }
				: { Authorization: 'Bearer ' + token, Accept: 'text/event-stream' },
			credentials: 'omit',
			signal: mine.signal
		}).then(function (r) {
			if (r.status === 401) { throw gone; } // the chat ended or expired
			if (!r.ok || !r.body) { throw new Error('stream ' + r.status); }
			retries = 0;
			var reader = r.body.getReader(), decoder = new TextDecoder(), feed = createSseParser(onServerEvent);
			return (function pump() {
				return reader.read().then(function (x) {
					if (x.done) { throw new Error('stream ended'); }
					feed(decoder.decode(x.value, { stream: true }));
					return pump();
				});
			})();
		}).catch(function (e) {
			if (!started || mine.signal.aborted) { return; }
			if (e === gone) { finish(); return; }
			retries++;
			if (retries === 3) { notice(t.error); }
			setTimeout(function () { if (started && ctrl === mine) { openStream(); } },
				Math.min(1000 * Math.pow(2, retries - 1), 15000));
		});
	}

	// Older servers (cookie sessions): EventSource reconnects by itself.
	function openLegacyStream() {
		es = new EventSource(cfg.backend + '/web/stream', { withCredentials: true });
		es.addEventListener('message', function (ev) {
			typing.hidden = true;
			try { addMsg(JSON.parse(ev.data).text, false); } catch (e) { /* ignore malformed */ }
		});
		es.addEventListener('typing', function () {
			typing.textContent = t.agentName + ' ' + t.typing;
			typing.hidden = false;
			clearTimeout(typingTimer);
			typingTimer = setTimeout(function () { typing.hidden = true; }, 4000);
		});
		es.addEventListener('banned', function (ev) { onServerEvent('banned', ev.data); });
		es.addEventListener('closed', finish);
		// EventSource reconnects by itself on transient errors.
	}

	function startChat(solution, attempt) {
		btnStart.disabled = true;
		var marker = storedMarker();
		api('/web/session', solution, marker ? { 'X-WPChat-Block': marker.marker } : null).then(function (j) {
			token = (j && j.token) || null;
			started = true;
			btnStart.textContent = t.start;
			consent.hidden = true; log.hidden = false; form.hidden = false; btnEnd.hidden = false;
			saveSession();
			openStream();
			input.focus();
		}).catch(function (e) {
			// The server asks for a short proof of work (after abuse, or when this address opens many chats)
			if (e && e.code === 'challenge_required' && e.body && e.body.challenge && attempt < 3) {
				btnStart.textContent = t.checking;
				solvePow(e.body.challenge, e.body.bits, function (nonce) {
					startChat({ challenge: e.body.challenge, nonce: nonce }, attempt + 1);
				}, function () {
					btnStart.textContent = t.start; btnStart.disabled = false;
					notice(t.error); log.hidden = false;
				}, 120000);
				return;
			}
			btnStart.textContent = t.start;
			btnStart.disabled = false;
			showProblem(e);
			log.hidden = false;
		});
	}

	btnStart.addEventListener('click', function () { startChat(null, 0); });

	form.addEventListener('submit', function (e) {
		e.preventDefault();
		var text = input.value.trim();
		if (!text) { return; }
		input.value = '';
		addMsg(text, true);
		api('/web/message', { text: text }).catch(function (e) {
			// 401: the chat ended or expired (or the page came back from the browser's back/forward cache)
			if (String(e && e.message) === '401') { finish(); } else { showProblem(e); }
		});
	});

	btnEnd.addEventListener('click', function () {
		api('/web/end').then(finish, finish);
	});
	btnMin.addEventListener('click', function () { toggle(false); });
	bubble.addEventListener('click', function () { toggle(true); });

	// Coming back to a chat in progress (reload, another page, a new tab with "browser" storage)
	var saved = token === null ? loadSession() : null;
	if (saved) {
		token = saved.token;
		getHistory().then(function (h) {
			started = true;
			consent.hidden = true; log.hidden = false; form.hidden = false; btnEnd.hidden = false;
			(h.messages || []).forEach(function (m) { addMsg(m.text, m.from === 'me'); });
			lastSeq = h.last || 0;
			openStream();
			if (saved.open) { toggle(true); }
		}).catch(function (e) {
			token = null;
			// Only a refused token means the chat is over; a network hiccup keeps it for the next page
			if (e && (e.status === 401 || e.status === 403)) { clearSession(); }
		});
	}
})();
