/* WP Chat widget. Talks directly to the switchboard-chat backend; nothing is stored locally.
 *
 * Backend contract. The session token returned by /web/session lives in this script's memory only
 * and is sent as `Authorization: Bearer <token>` (no cookie, so browsers that block third-party
 * cookies work). A server older than switchboard-chat's token mode returns no token and sets a
 * cookie instead: the widget then falls back to cookies + EventSource.
 *   POST /web/session  -> 200 {"resumed":false,"token":"…"}   create session
 *   POST /web/message  {text}  -> 200 {}                       visitor message
 *   GET  /web/stream   -> SSE events: message {text}, typing {}, closed {}
 *   POST /web/end      -> 200 {}                               end chat and delete
 */
(function () {
	'use strict';

	// Incremental parser of a text/event-stream: feed(chunk) calls onEvent(name, data) per event.
	function createSseParser(onEvent) {
		var buf = '', evt = 'message', data = '';
		return function (chunk) {
			buf += chunk;
			var lines = buf.split('\n');
			buf = lines.pop();
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i].replace(/\r$/, '');
				if (line === '') {
					if (data !== '') { onEvent(evt, data); }
					evt = 'message'; data = '';
				} else if (line.charAt(0) !== ':') { // ":" lines are keep-alive comments
					var idx = line.indexOf(':');
					var field = idx < 0 ? line : line.slice(0, idx);
					var value = idx < 0 ? '' : line.slice(idx + 1).replace(/^ /, '');
					if (field === 'event') { evt = value; }
					else if (field === 'data') { data += (data !== '' ? '\n' : '') + value; }
				}
			}
		};
	}
	window.WPChat = window.WPChat || {};
	window.WPChat.createSseParser = createSseParser;
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
	var token = null, ctrl = null, retries = 0;

	function el(tag, cls, text) {
		var e = document.createElement(tag);
		if (cls) { e.className = cls; }
		if (text) { e.textContent = text; }
		return e;
	}

	function api(path, body) {
		var headers = { 'Content-Type': 'application/json' };
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
					throw err;
				});
			}
			return r.json().catch(function () { return {}; });
		});
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
	}

	function closeStream() {
		if (es) { es.close(); es = null; }
		if (ctrl) { ctrl.abort(); ctrl = null; }
	}

	function finish() {
		closeStream();
		started = false;
		token = null;
		form.hidden = true;
		btnEnd.hidden = true;
		notice(t.ended);
	}

	function onServerEvent(name, data) {
		if (name === 'message') {
			typing.hidden = true;
			try { addMsg(JSON.parse(data).text, false); } catch (e) { /* ignore malformed */ }
		} else if (name === 'typing') {
			typing.textContent = t.agentName + ' ' + t.typing;
			typing.hidden = false;
			clearTimeout(typingTimer);
			typingTimer = setTimeout(function () { typing.hidden = true; }, 4000);
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
			headers: { Authorization: 'Bearer ' + token, Accept: 'text/event-stream' },
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
		es.addEventListener('closed', finish);
		// EventSource reconnects by itself on transient errors.
	}

	btnStart.addEventListener('click', function () {
		btnStart.disabled = true;
		api('/web/session').then(function (j) {
			token = (j && j.token) || null;
			started = true;
			consent.hidden = true; log.hidden = false; form.hidden = false; btnEnd.hidden = false;
			openStream();
			input.focus();
		}).catch(function (e) {
			btnStart.disabled = false;
			showProblem(e);
			log.hidden = false;
		});
	});

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
	// Leaving the page ends the chat: the token only lives in this page, so nobody could come back to it
	window.addEventListener('pagehide', function () {
		if (started && token && navigator.sendBeacon) {
			try {
				navigator.sendBeacon(cfg.backend + '/web/end',
					new Blob([JSON.stringify({ token: token })], { type: 'text/plain' }));
			} catch (e) { /* best effort: the server also ends chats whose visitor disappeared */ }
		}
	});
	btnMin.addEventListener('click', function () { toggle(false); });
	bubble.addEventListener('click', function () { toggle(true); });
})();
