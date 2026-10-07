// End-to-end test of the widget's connection logic: runs wp-chat/assets/chat.js (real fetch, real
// streaming, fake DOM) against a small mock of the switchboard-chat web API.
//   node tests/widget-flow.test.js
const fs = require('fs'), vm = require('vm'), http = require('http');
const code = fs.readFileSync('wp-chat/assets/chat.js', 'utf8');
const strings = JSON.parse(fs.readFileSync('wp-chat/languages/widget-strings.json', 'utf8'));

class El {
  constructor(tag) { this.tag = tag; this.attrs = {}; this.children = []; this.listeners = {}; this.style = { setProperty() {} }; this.hidden = false; this.value = ''; this.scrollTop = 0; this.scrollHeight = 0; }
  setAttribute(k, v) { this.attrs[k] = v; }
  appendChild(c) { this.children.push(c); }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  fire(type) { (this.listeners[type] || []).forEach(fn => fn({ preventDefault() {} })); }
  focus() {}
}

function startWidget(base) {
  const made = [], root = new El('div'), winListeners = {}, beacons = [], esCreated = [];
  const document = { getElementById: () => root, createElement: t => { const e = new El(t); made.push(e); return e; } };
  const window = { WPChatConfig: { backend: base, color: '#000', privacyUrl: '', officer: '', langMode: 'en', siteLang: 'en', strings, custom: {} },
    navigator: { language: 'en', sendBeacon: (url, blob) => { beacons.push({ url, blob }); return true; } },
    addEventListener: (t, fn) => { winListeners[t] = fn; } };
  function EventSource(url, opts) { esCreated.push({ url, opts }); this.addEventListener = () => {}; this.close = () => {}; }
  vm.runInNewContext(code, { window, document, navigator: window.navigator, EventSource, fetch, AbortController, TextDecoder, Blob, JSON, Math, setTimeout, clearTimeout });
  const byClass = c => made.find(e => e.className === c);
  const texts = () => made.filter(e => /^wpc-(msg|notice)/.test(e.className || '')).map(e => (e.className.includes('notice') ? '[notice] ' : '') + e.textContent);
  return { root, made, byClass, texts, winListeners, beacons, esCreated };
}
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(cond, label, ms = 4000) { const t0 = Date.now(); while (!cond()) { if (Date.now() - t0 > ms) throw new Error('timeout waiting for: ' + label); await wait(20); } }

let failures = 0;
const check = (ok, name) => { if (!ok) failures++; console.log(ok ? 'PASS' : 'FAIL', name); };

async function tokenMode() {
  const log = { streams: 0, auth: [], messages: [], ends: [] };
  const server = http.createServer((req, res) => {
    let body = ''; req.on('data', d => body += d);
    req.on('end', () => {
      const auth = req.headers.authorization || '';
      if (req.url === '/web/session') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ resumed: false, token: 'tok123' })); }
      if (req.url === '/web/stream') {
        log.streams++; log.auth.push(auth);
        if (auth !== 'Bearer tok123' || log.streams === 3) { res.statusCode = 401; return res.end('{"error":"no_session"}'); } // 3rd connection: chat ended
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write(': keep-alive\n\n');
        if (log.streams === 1) {
          // one event split across network chunks, then the connection drops
          setTimeout(() => res.write('event: mess'), 30);
          setTimeout(() => res.write('age\ndata: {"text":"Bon'), 60);
          setTimeout(() => res.write('jour"}\n\n'), 90);
          setTimeout(() => res.end(), 150);
        } else {
          setTimeout(() => res.write('event: message\ndata: {"text":"Encore ici"}\n\n'), 30);
          setTimeout(() => res.end(), 100);
        }
        return;
      }
      if (req.url === '/web/message') { log.messages.push({ auth, body: JSON.parse(body) }); res.setHeader('content-type', 'application/json'); return res.end('{}'); }
      if (req.url === '/web/end') { log.ends.push({ auth, body }); res.setHeader('content-type', 'application/json'); return res.end('{}'); }
      res.statusCode = 404; res.end();
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const w = startWidget('http://127.0.0.1:' + server.address().port);
  w.byClass('wpc-start').fire('click');
  await until(() => w.texts().includes('Bonjour'), 'a message split across chunks');
  check(true, 'token mode: reply split across network chunks is assembled and shown');
  check(log.auth[0] === 'Bearer tok123', 'token mode: the stream request carries the Authorization header');
  check(w.esCreated.length === 0, 'token mode: EventSource (cookies) is not used');
  const input = w.byClass('wpc-input'); input.value = 'Salut';
  w.byClass('wpc-form').fire('submit');
  await until(() => log.messages.length === 1, 'message POST');
  check(log.messages[0].auth === 'Bearer tok123' && log.messages[0].body.text === 'Salut', 'token mode: message sent with the token');
  await until(() => w.texts().includes('Encore ici'), 'reconnection after the stream dropped', 6000);
  check(log.streams >= 2, 'token mode: the widget reconnects after the stream is cut');
  await until(() => w.texts().some(t => t.startsWith('[notice] ') && t.includes('ended')), 'ended notice after a 401', 8000);
  check(true, 'token mode: a 401 on the stream ends the chat (expired / ended)');
  server.close();
}

async function beaconOnPageHide() {
  const log = { ends: [] };
  const server = http.createServer((req, res) => {
    let body = ''; req.on('data', d => body += d);
    req.on('end', () => {
      if (req.url === '/web/session') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ token: 'tokB' })); }
      if (req.url === '/web/stream') { res.writeHead(200, { 'content-type': 'text/event-stream' }); res.write(': hi\n\n'); return; }
      res.end('{}');
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const w = startWidget('http://127.0.0.1:' + server.address().port);
  w.winListeners.pagehide(); // before any chat: nothing to end
  check(w.beacons.length === 0, 'pagehide before a chat started sends nothing');
  w.byClass('wpc-start').fire('click');
  await until(() => !w.byClass('wpc-form').hidden, 'chat started');
  w.winListeners.pagehide();
  check(w.beacons.length === 1 && w.beacons[0].url.endsWith('/web/end'), 'pagehide during a chat sends an end beacon');
  const text = await w.beacons[0].blob.text();
  check(JSON.parse(text).token === 'tokB', 'the beacon body carries the token (beacons cannot set headers)');
  server.close(); // the open stream is dropped with the process
}

async function legacyCookieServer() {
  const server = http.createServer((req, res) => {
    req.on('data', () => {}); req.on('end', () => { res.setHeader('content-type', 'application/json'); res.end('{"resumed":false}'); });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const w = startWidget('http://127.0.0.1:' + server.address().port);
  w.byClass('wpc-start').fire('click');
  await until(() => w.esCreated.length === 1, 'legacy EventSource');
  check(w.esCreated[0].opts.withCredentials === true && w.esCreated[0].url.endsWith('/web/stream'), 'old server (no token): falls back to cookies + EventSource');
  server.close();
}

(async () => {
  try { await tokenMode(); await beaconOnPageHide(); await legacyCookieServer(); }
  catch (e) { failures++; console.log('FAIL', e.message); }
  console.log(failures ? failures + ' failure(s)' : 'all passed');
  process.exit(failures ? 1 : 0);
})();
