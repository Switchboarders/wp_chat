const fs = require('fs'), vm = require('vm');
const code = fs.readFileSync('wp-chat/assets/chat.js', 'utf8');
const strings = JSON.parse(fs.readFileSync('wp-chat/languages/widget-strings.json', 'utf8'));
class El { constructor(tag){ this.tag=tag; this.attrs={}; this.children=[]; this.style={setProperty(){}}; this.hidden=false; }
  setAttribute(k,v){ this.attrs[k]=v; } appendChild(c){ this.children.push(c); } addEventListener(){} focus(){} }
function run(cfgOver, nav) {
  const made = []; const root = new El('div');
  const document = { getElementById: () => root, createElement: t => { const e = new El(t); made.push(e); return e; } };
  const cfg = Object.assign({ backend:'https://x', color:'#000', privacyUrl:'', officer:'', langMode:'auto', siteLang:'en', strings, custom:{} }, cfgOver);
  const window = { WPChatConfig: cfg, navigator: nav, location: {}, addEventListener() {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} } };
  vm.runInNewContext(code, { window, document, navigator: nav, EventSource: function(){}, fetch(){}, setTimeout, clearTimeout });
  const texts = made.map(e => e.textContent).filter(Boolean);
  const bubble = made.find(e => e.tag === 'button' && e.attrs['aria-label']);
  return { lang: root.lang, title: made.find(e => e.className === 'wpc-title').textContent, send: made.find(e => e.className === 'wpc-send').textContent, bubble: bubble.attrs['aria-label'], retention: texts.find(t => /24/.test(t)) };
}
const cases = [
  ['auto, browser fr-CA,en',            {}, { languages: ['fr-CA','en'] },                'fr'],
  ['auto, browser en-US',               {}, { languages: ['en-US'] },                     'en'],
  ['auto, browser es then fr-FR',       {}, { languages: ['es','fr-FR'] },                'fr'],
  ['auto, browser es only, site fr',    { siteLang:'fr' }, { languages: ['es'] },          'fr'],
  ['auto, browser es only, site en',    { siteLang:'en' }, { languages: ['es'] },          'en'],
  ['auto, old browser (language only)', {}, { language: 'fr-CA' },                        'fr'],
  ['mode site=fr, browser en',          { langMode:'site', siteLang:'fr' }, { languages:['en'] }, 'fr'],
  ['mode site=en, browser fr',          { langMode:'site', siteLang:'en' }, { languages:['fr'] }, 'en'],
  ['forced en, browser fr',             { langMode:'en' }, { languages:['fr'] },           'en'],
  ['forced fr, browser en',             { langMode:'fr' }, { languages:['en'] },           'fr'],
];
let bad = 0;
for (const [name, over, nav, want] of cases) {
  const r = run(over, nav); const ok = r.lang === want && r.title === strings[want].agentName && r.bubble === strings[want].open && r.send === strings[want].send;
  if (!ok) bad++; console.log((ok ? 'PASS' : 'FAIL'), name.padEnd(36), '->', r.lang, '|', r.title, '|', r.bubble);
}
const c = run({ custom: { agentName: 'Alex', retention: 'Custom retention 24 h' } }, { languages: ['fr'] });
const okc = c.title === 'Alex' && c.retention === 'Custom retention 24 h' && c.send === 'Envoyer'; if (!okc) bad++;
console.log(okc ? 'PASS' : 'FAIL', 'custom name + retention shown as typed, rest French ->', c.title, '|', c.retention, '|', c.send);
process.exit(bad ? 1 : 0);
