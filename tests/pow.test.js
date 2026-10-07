// The widget's SHA-256 and proof-of-work solver against Node's crypto.   node tests/pow.test.js
const fs = require('fs'), vm = require('vm'), crypto = require('crypto');
const sandbox = { window: { WPChatConfig: null }, document: { getElementById: () => null }, setTimeout, Date };
vm.runInNewContext(fs.readFileSync('wp-chat/assets/chat.js', 'utf8'), sandbox); // exposes window.WPChat, then stops (no config)
const { sha256, zeroBits, solvePow } = sandbox.window.WPChat;
let bad = 0; const check = (ok, n) => { if (!ok) bad++; console.log(ok ? 'PASS' : 'FAIL', n); };
const hex = u8 => Buffer.from(u8).toString('hex');
check(hex(sha256('')) === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'SHA-256 of the empty string');
check(hex(sha256('abc')) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'SHA-256 of "abc"');
let all = true;
for (let len = 0; len <= 300; len++) {
  const s = Array.from({ length: len }, (_, i) => String.fromCharCode(33 + ((i * 7 + len) % 90))).join('');
  if (hex(sha256(s)) !== crypto.createHash('sha256').update(s, 'latin1').digest('hex')) { all = false; console.log('mismatch at length', len); }
}
check(all, 'SHA-256 matches Node crypto for every length from 0 to 300 (block boundaries at 55/56/64)');
check(zeroBits(new Uint8Array([0xff])) === 0 && zeroBits(new Uint8Array([0x0f])) === 4 && zeroBits(new Uint8Array([0, 0x80])) === 8 && zeroBits(new Uint8Array([0, 0, 1])) === 23 && zeroBits(new Uint8Array(4)) === 32, 'leading zero bit count');
const t0 = Date.now();
solvePow('1700000000.salt.12.mac', 12, nonce => {
  const d = crypto.createHash('sha256').update('1700000000.salt.12.mac:' + nonce).digest();
  const bits = (() => { let b = 0; for (const x of d) { if (x === 0) { b += 8; continue; } b += Math.clz32(x) - 24; break; } return b; })();
  check(bits >= 12, 'the solver finds a nonce that Node confirms (12 bits) in ' + (Date.now() - t0) + ' ms');
  const t1 = Date.now();
  solvePow('x.y.18.z', 18, n2 => { check(true, '18 bits solved in ' + (Date.now() - t1) + ' ms'); process.exit(bad ? 1 : 0); }, () => { check(false, 'solver gave up'); process.exit(1); }, 60000);
}, () => { check(false, 'solver gave up'); process.exit(1); }, 20000);
