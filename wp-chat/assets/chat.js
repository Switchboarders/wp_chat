/* WP Chat widget. Talks directly to the switchboard-chat backend; nothing is stored locally.
 *
 * Backend contract (all calls use credentials:'include'; the session cookie is set by the backend):
 *   POST /web/session  -> 200 {}                      create session
 *   POST /web/message  {text}  -> 200 {}              visitor message
 *   GET  /web/stream   -> SSE events: message {text}, typing {}, closed {}
 *   POST /web/end      -> 200 {}                      end chat and delete
 */
(function () {
	'use strict';
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

	function el(tag, cls, text) {
		var e = document.createElement(tag);
		if (cls) { e.className = cls; }
		if (text) { e.textContent = text; }
		return e;
	}

	function api(path, body) {
		return fetch(cfg.backend + path, {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body || {})
		}).then(function (r) { if (!r.ok) { throw new Error(r.status); } });
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
	var btnExit = el('button', 'wpc-btn', t.exit); btnExit.type = 'button';
	var btnEnd = el('button', 'wpc-btn', t.end); btnEnd.type = 'button'; btnEnd.hidden = true;
	var btnMin = el('button', 'wpc-btn', '–'); btnMin.type = 'button';
	btnMin.setAttribute('aria-label', t.minimize);
	head.appendChild(btnExit); head.appendChild(btnEnd); head.appendChild(btnMin);

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

	function toggle(open) {
		win.hidden = !open;
		bubble.hidden = open;
		if (open && started) { input.focus(); }
	}

	function closeStream() { if (es) { es.close(); es = null; } }

	function finish() {
		closeStream();
		started = false;
		form.hidden = true;
		btnEnd.hidden = true;
		notice(t.ended);
	}

	function openStream() {
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
		api('/web/session').then(function () {
			started = true;
			consent.hidden = true; log.hidden = false; form.hidden = false; btnEnd.hidden = false;
			openStream();
			input.focus();
		}).catch(function () {
			btnStart.disabled = false;
			notice(t.error);
			log.hidden = false;
		});
	});

	form.addEventListener('submit', function (e) {
		e.preventDefault();
		var text = input.value.trim();
		if (!text) { return; }
		input.value = '';
		addMsg(text, true);
		api('/web/message', { text: text }).catch(function () { notice(t.error); });
	});

	btnEnd.addEventListener('click', function () {
		api('/web/end').then(finish, finish);
	});
	btnExit.addEventListener('click', function () {
		if (started) { navigator.sendBeacon && navigator.sendBeacon(cfg.backend + '/web/end'); }
		closeStream();
		window.location.replace(cfg.quickExit);
	});
	btnMin.addEventListener('click', function () { toggle(false); });
	bubble.addEventListener('click', function () { toggle(true); });
})();
