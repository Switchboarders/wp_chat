// Unit test of the link detection in messages.   node tests/links.test.js
const fs = require('fs'), vm = require('vm');
const sandbox = { window: { WPChatConfig: null }, document: { getElementById: () => null } };
vm.runInNewContext(fs.readFileSync('wp-chat/assets/chat.js', 'utf8'), sandbox);
const split = sandbox.window.WPChat.splitLinks;
let bad = 0; const check = (ok, n) => { if (!ok) bad++; console.log(ok ? 'PASS' : 'FAIL', n); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
check(eq(split('bonjour'), [{ text: 'bonjour' }]), 'no link: one plain part');
check(eq(split('Réunions : https://aa89.org/meetings Merci.'),
	[{ text: 'Réunions : ' }, { text: 'https://aa89.org/meetings', href: 'https://aa89.org/meetings' }, { text: ' Merci.' }]), 'link in the middle');
check(eq(split('Voir https://aa89.org/mg.'), [{ text: 'Voir ' }, { text: 'https://aa89.org/mg', href: 'https://aa89.org/mg' }, { text: '.' }]), 'final period is not part of the link');
check(eq(split('www.aa-quebec.org'), [{ text: 'www.aa-quebec.org', href: 'https://www.aa-quebec.org' }]), 'www. gets https://');
check(eq(split('(https://x.org/a)'), [{ text: '(' }, { text: 'https://x.org/a', href: 'https://x.org/a' }, { text: ')' }]), 'closing parenthesis outside the link');
check(eq(split('https://fr.wikipedia.org/wiki/A_(b)'), [{ text: 'https://fr.wikipedia.org/wiki/A_(b)', href: 'https://fr.wikipedia.org/wiki/A_(b)' }]), 'balanced parenthesis kept');
check(eq(split('a http://x.org b https://y.org/?q=1&r=2').filter(p => p.href).map(p => p.href), ['http://x.org', 'https://y.org/?q=1&r=2']), 'two links');
check(split('javascript:alert(1) <a href="x">').every(p => !p.href), 'no javascript: or HTML link');
process.exit(bad ? 1 : 0);
