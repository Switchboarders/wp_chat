// Drives the REAL widget (wp-chat/assets/chat.js, fake DOM) against a REAL switchboard-chat server.
// Used by switchboard-chat's tests/e2e/run.py (scenario "widget"); not a standalone test.
//
//   node tests/widget-e2e-driver.js <backend-url> <origin>
//
// Commands on stdin (one JSON per line), answers on stdout (one JSON per line):
//   {"cmd":"load"}            a page load (a fresh script run; sessionStorage survives, like a real tab)
//   {"cmd":"start"}           the visitor presses the start button
//   {"cmd":"say","text":"…"}  the visitor types and sends
//   {"cmd":"end"}             the visitor presses "End chat"
//   {"cmd":"texts"}           -> {"event":"texts","texts":[…],"form":bool,"consent":bool}
const fs = require('fs'), vm = require('vm'), path = require('path'), readline = require('readline');
const backend = process.argv[2], origin = process.argv[3];
const root = path.join(__dirname, '..', 'wp-chat');
const code = fs.readFileSync(path.join(root, 'assets', 'chat.js'), 'utf8');
const strings = JSON.parse(fs.readFileSync(path.join(root, 'languages', 'widget-strings.json'), 'utf8'));

class El {
  constructor(tag) { this.tag = tag; this.attrs = {}; this.children = []; this.listeners = {}; this.style = { setProperty() {} }; this.hidden = false; this.value = ''; this.scrollTop = 0; this.scrollHeight = 0; }
  setAttribute(k, v) { this.attrs[k] = v; }
  appendChild(c) { this.children.push(c); }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  fire(type) { (this.listeners[type] || []).forEach(fn => fn({ preventDefault() {} })); }
  focus() {}
}
function storage() { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _m: m }; }
const sessionStorage = storage(), localStorage = storage();     // survive page loads
const emit = o => console.log(JSON.stringify(o));
const fetchWithOrigin = (url, opts = {}) => fetch(url, { ...opts, headers: { ...(opts.headers || {}), Origin: origin } });

let page = null;
function load() {
  const made = [], rootEl = new El('div');
  const document = { getElementById: () => rootEl, createElement: t => { const e = new El(t); made.push(e); return e; } };
  const window = {
    WPChatConfig: { backend, color: '#000', privacyUrl: '', officer: '', langMode: 'en', siteLang: 'en', strings, custom: {}, remember: 'tab' },
    navigator: { language: 'en' }, localStorage, sessionStorage, addEventListener: () => {},
  };
  function EventSource() { throw new Error('legacy EventSource must not be used'); }
  vm.runInNewContext(code, { window, document, navigator: window.navigator, EventSource, fetch: fetchWithOrigin, AbortController, TextDecoder, Blob, JSON, Math, setTimeout, clearTimeout, Date, console });
  const byClass = c => made.find(e => e.className === c);
  page = { made, byClass };
}
function texts() { return page.made.filter(e => /^wpc-(msg|notice)/.test(e.className || '')).map(e => (e.className.includes('notice') ? '[notice] ' : '') + e.textContent); }

readline.createInterface({ input: process.stdin }).on('line', line => {
  let c; try { c = JSON.parse(line); } catch (e) { return; }
  try {
    if (c.cmd === 'load') { load(); setTimeout(() => emit({ event: 'loaded', restored: !!sessionStorage.getItem('wpchat_session') }), 300); }
    else if (c.cmd === 'start') { page.byClass('wpc-start').fire('click'); }
    else if (c.cmd === 'say') { page.byClass('wpc-input').value = c.text; page.byClass('wpc-form').fire('submit'); }
    else if (c.cmd === 'end') { page.made.filter(e => e.className === 'wpc-btn')[0].fire('click'); }
    else if (c.cmd === 'texts') {
      emit({ event: 'texts', texts: texts(), form: !page.byClass('wpc-form').hidden, consent: !page.byClass('wpc-consent').hidden, saved: !!sessionStorage.getItem('wpchat_session') });
    }
  } catch (e) { emit({ event: 'error', message: String(e) }); }
});
emit({ event: 'ready' });
