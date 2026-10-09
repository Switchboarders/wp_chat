// End-to-end test of the widget's connection logic: runs wp-chat/assets/chat.js (real fetch, real
// streaming, fake DOM) against a small mock of the switchboard-chat web API.
//   node tests/widget-flow.test.js
const fs = require('fs'), vm = require('vm'), http = require('http'), crypto = require('crypto');
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

function fakeStorage(initial) { const m = new Map(Object.entries(initial || {})); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _m: m }; }

function startWidget(base, extraCfg, storage, session) {
  const made = [], root = new El('div'), winListeners = {}, beacons = [], esCreated = [];
  const document = { getElementById: () => root, createElement: t => { const e = new El(t); made.push(e); return e; } };
  const window = { WPChatConfig: { backend: base, color: '#000', privacyUrl: '', officer: '', langMode: 'en', siteLang: 'en', strings, custom: {}, ...(extraCfg || {}) },
    navigator: { language: 'en', sendBeacon: (url, blob) => { beacons.push({ url, blob }); return true; } },
    localStorage: storage || fakeStorage(),
    sessionStorage: session || fakeStorage(),
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

// A reload or another page of the site: the chat comes back from the session kept in the tab
async function survivesReload() {
  const log = { streamHeaders: [], historyAuth: [], ends: 0 };
  let alive = true;
  const server = http.createServer((req, res) => {
    let body = ''; req.on('data', d => body += d);
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (req.url === '/web/session') { return res.end(JSON.stringify({ token: 'tokB' })); }
      if (req.url === '/web/history') {
        log.historyAuth.push(req.headers.authorization);
        if (!alive || req.headers.authorization !== 'Bearer tokB') { res.statusCode = 401; return res.end('{"error":"no_session"}'); }
        return res.end(JSON.stringify({ last: 3, messages: [{ seq: 1, from: 'me', text: 'Allo' }, { seq: 2, from: 'them', text: 'Bonjour' }, { seq: 3, from: 'them', text: 'Comment ca va' }] }));
      }
      if (req.url === '/web/stream') {
        log.streamHeaders.push(req.headers['last-event-id'] || null);
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write(': hi\n\n');
        // a replay of a line already shown (seq 3) and then a new one (seq 4)
        setTimeout(() => res.write('event: message\nid: 3\ndata: {"text":"Comment ca va"}\n\nevent: message\nid: 4\ndata: {"text":"Nouveau"}\n\n'), 40);
        return;
      }
      if (req.url === '/web/end') { log.ends++; }
      res.end('{}');
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port, session = fakeStorage(), local = fakeStorage();
  const w = startWidget(base, {}, local, session);
  check(w.winListeners.pagehide === undefined, 'leaving the page no longer ends the chat');
  w.byClass('wpc-start').fire('click');
  await until(() => !w.byClass('wpc-form').hidden, 'chat started');
  const kept = JSON.parse(session.getItem('wpchat_session') || 'null');
  check(kept && kept.token === 'tokB' && local.getItem('wpchat_session') === null, 'the session code is kept in this tab only (sessionStorage), not in localStorage');
  // new page, same tab
  const w2 = startWidget(base, {}, local, session);
  await until(() => w2.texts().includes('Nouveau'), 'restored chat receives live lines');
  const t = w2.texts();
  check(t[0] === 'Allo' && t[1] === 'Bonjour' && t[2] === 'Comment ca va', 'reload: the conversation is restored from the server history, in order');
  check(t.filter(x => x === 'Comment ca va').length === 1, 'reload: a replayed line is not shown twice');
  check(log.historyAuth[0] === 'Bearer tokB' && log.streamHeaders[log.streamHeaders.length - 1] === '3', 'reload: history and stream use the saved token; the stream resumes after line 3');
  check(!w2.byClass('wpc-form').hidden && w2.byClass('wpc-consent').hidden, 'reload: the chat is back without asking for consent again');
  // "browser" mode keeps the code in localStorage instead
  const sess2 = fakeStorage(), local2 = fakeStorage();
  const w3 = startWidget(base, { remember: 'browser' }, local2, sess2);
  w3.byClass('wpc-start').fire('click');
  await until(() => !w3.byClass('wpc-form').hidden, 'chat started in browser mode');
  check(local2.getItem('wpchat_session') !== null && sess2.getItem('wpchat_session') === null, 'remember=browser: kept in localStorage');
  // an ended chat is forgotten: refused token clears the saved session
  alive = false;
  const w4 = startWidget(base, {}, local, session);
  await until(() => session.getItem('wpchat_session') === null, 'dead session removed');
  check(w4.byClass('wpc-consent').hidden !== true, 'ended chat: the visitor sees the consent screen again');
  // ending the chat erases the saved session
  alive = true;
  const s3 = fakeStorage();
  const w5 = startWidget(base, {}, local, s3);
  w5.byClass('wpc-start').fire('click');
  await until(() => !w5.byClass('wpc-form').hidden, 'chat started again');
  const btnEnd = w5.made.filter(e => e.className === 'wpc-btn')[0];
  btnEnd.fire('click');
  await until(() => s3.getItem('wpchat_session') === null, 'session erased when the visitor ends the chat');
  check(log.ends >= 1, 'ending the chat tells the server');
  server.close();
}

async function refusedVisitors() {
  for (const [code, status, expectKey, withExtra] of [['blocked', 403, 'blocked', true], ['no_respondent', 503, 'unavailable', true], ['busy', 503, 'busy', true], ['rate_limited', 429, 'rate', false]]) {
    const server = http.createServer((req, res) => {
      req.on('data', () => {}); req.on('end', () => { res.statusCode = status; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ error: code })); });
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const w = startWidget('http://127.0.0.1:' + server.address().port, { unavailableText: 'Call 555-0100.' });
    w.byClass('wpc-start').fire('click');
    await until(() => w.texts().some(t => t.includes(strings.en[expectKey])), 'message for ' + code);
    const extra = w.texts().some(t => t.includes('Call 555-0100.'));
    check(extra === withExtra, code + ': shows "' + strings.en[expectKey].slice(0, 30) + '…"' + (withExtra ? ' plus the administrator\'s contact text' : ' without the contact text'));
    check(w.byClass('wpc-form').hidden === true, code + ': no chat is started');
    server.close();
  }
}

function zeroBitsOf(buf) { let b = 0; for (const x of buf) { if (x === 0) { b += 8; continue; } b += Math.clz32(x) - 24; break; } return b; }

async function noRespondentMacro() {
  const MACRO = 'Aucun bénévole pour le moment. Appelez le 555-0199.';
  const server = http.createServer((req, res) => {
    req.on('data', () => {}); req.on('end', () => { res.statusCode = 503; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ error: 'no_respondent', message: MACRO })); });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const w = startWidget('http://127.0.0.1:' + server.address().port, { unavailableText: 'Call 555-0100.' });
  w.byClass('wpc-start').fire('click');
  await until(() => w.texts().some(t => t.includes(MACRO)), 'no_respondent macro shown');
  check(!w.texts().some(t => t.includes(strings.en.unavailable)), 'no_respondent: the call center macro replaces the generic sentence');
  check(w.texts().some(t => t.includes('Call 555-0100.')), 'no_respondent: the administrator contact text is still shown');
  server.close();
}

async function challengeFlow() {
  const log = { sessionCalls: 0, solved: null };
  const CH = 'chal.v1', BITS = 12;
  const server = http.createServer((req, res) => {
    let body = ''; req.on('data', d => body += d);
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (req.url === '/web/session') {
        log.sessionCalls++;
        let sol = null; try { sol = JSON.parse(body); } catch (e) { /* first call has no body */ }
        if (sol && sol.challenge === CH && sol.nonce && zeroBitsOf(crypto.createHash('sha256').update(CH + ':' + sol.nonce).digest()) >= BITS) { log.solved = sol.nonce; return res.end(JSON.stringify({ resumed: false, token: 'tokC' })); }
        res.statusCode = 428; return res.end(JSON.stringify({ error: 'challenge_required', challenge: CH, bits: BITS }));
      }
      if (req.url === '/web/stream') { res.writeHead(200, { 'content-type': 'text/event-stream' }); return res.write(': hi\n\n'); }
      res.end('{}');
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const w = startWidget('http://127.0.0.1:' + server.address().port);
  w.byClass('wpc-start').fire('click');
  await until(() => !w.byClass('wpc-form').hidden, 'chat started after the challenge');
  check(log.sessionCalls === 2 && log.solved !== null, 'challenge: first call refused (428), the widget solves it and the retry is accepted (nonce ' + log.solved + ')');
  check(w.byClass('wpc-start').textContent === strings.en.start, 'challenge: the start button text is restored');
  server.close();
}

async function bannedBrowserMarker() {
  const seen = { blockHeaders: [] };
  const MARKER = '1700000000.' + (Math.floor(Date.now() / 1000) + 86400) + '.sig';
  const server = http.createServer((req, res) => {
    let body = ''; req.on('data', d => body += d);
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (req.url === '/web/session') {
        seen.blockHeaders.push(req.headers['x-wpchat-block'] || null);
        if (req.headers['x-wpchat-block']) { res.statusCode = 403; return res.end(JSON.stringify({ error: 'blocked' })); }
        return res.end(JSON.stringify({ resumed: false, token: 'tokD' }));
      }
      if (req.url === '/web/stream') {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write(': hi\n\n');
        setTimeout(() => res.write('event: banned\ndata: ' + JSON.stringify({ until: Math.floor(Date.now() / 1000) + 86400, marker: MARKER }) + '\n\nevent: closed\ndata: {}\n\n'), 60);
        return;
      }
      res.end('{}');
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port, storage = fakeStorage();
  const w = startWidget(base, { unavailableText: 'Call 555-0100.' }, storage);
  check(storage.getItem('wpchat_blocked') === null, 'marker: nothing is stored for a visitor who was never blocked');
  w.byClass('wpc-start').fire('click');
  await until(() => storage.getItem('wpchat_blocked') !== null, 'marker stored after a ban');
  check(JSON.parse(storage.getItem('wpchat_blocked')).marker === MARKER, 'marker: the banned browser keeps the server\'s signed marker');
  await until(() => w.texts().some(t => t.includes(strings.en.blocked)), 'blocked message');
  check(w.texts().some(t => t.includes('Call 555-0100.')), 'marker: the visitor is told the chat is not available and shown the contact text');
  // the same browser later, from another "network": the marker is sent and the server refuses
  const w2 = startWidget(base, {}, storage);
  w2.byClass('wpc-start').fire('click');
  await until(() => w2.texts().some(t => t.includes(strings.en.blocked)), 'blocked again');
  check(seen.blockHeaders[seen.blockHeaders.length - 1] === MARKER, 'marker: sent in X-WPChat-Block when a new chat is requested');
  // an expired marker is dropped and not sent
  const old = fakeStorage({ wpchat_blocked: JSON.stringify({ until: Math.floor(Date.now() / 1000) - 10, marker: 'old.marker.sig' }) });
  const w3 = startWidget(base, {}, old);
  w3.byClass('wpc-start').fire('click');
  await until(() => !w3.byClass('wpc-form').hidden, 'chat starts with an expired marker');
  check(seen.blockHeaders[seen.blockHeaders.length - 1] === null && old.getItem('wpchat_blocked') === null, 'marker: an expired marker is removed and not sent');
  server.close();
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
  try { await tokenMode(); await survivesReload(); await refusedVisitors(); await noRespondentMacro(); await challengeFlow(); await bannedBrowserMarker(); await legacyCookieServer(); }
  catch (e) { failures++; console.log('FAIL', e.message); }
  console.log(failures ? failures + ' failure(s)' : 'all passed');
  process.exit(failures ? 1 : 0);
})();
