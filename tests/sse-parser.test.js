// Unit test of the widget's text/event-stream parser.   node tests/sse-parser.test.js
const fs = require('fs'), vm = require('vm');
const sandbox = { window: { WPChatConfig: null }, document: { getElementById: () => null } };
vm.runInNewContext(fs.readFileSync('wp-chat/assets/chat.js', 'utf8'), sandbox); // exposes window.WPChat.createSseParser, then stops (no config)
const create = sandbox.window.WPChat.createSseParser;
let bad = 0; const check = (ok, n) => { if (!ok) bad++; console.log(ok ? 'PASS' : 'FAIL', n); };
const run = chunks => { const out = []; const feed = create((n, d) => out.push([n, d])); chunks.forEach(feed); return out; };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
check(eq(run(['event: message\ndata: {"a":1}\n\n']), [['message', '{"a":1}']]), 'one event');
check(eq(run(['event: mess', 'age\nda', 'ta: {"a":1}\n', '\n']), [['message', '{"a":1}']]), 'event split at arbitrary points');
check(eq(run([': keep-alive\n\n']), []), 'keep-alive comment produces nothing');
check(eq(run(['data: x\n\n']), [['message', 'x']]), 'default event name is message');
check(eq(run(['event: closed\ndata: {}\n\n', 'event: message\ndata: y\n\n']), [['closed', '{}'], ['message', 'y']]), 'two events in order');
check(eq(run(['event: message\r\ndata: z\r\n\r\n']), [['message', 'z']]), 'CRLF line endings');
check(eq(run(['data: l1\ndata: l2\n\n']), [['message', 'l1\nl2']]), 'multi-line data joined with a newline');
check(eq(run(['event: message\n\n']), []), 'event without data is ignored');
check(eq(run(['event:message\ndata:no-space\n\n']), [['message', 'no-space']]), 'no space after the colon');
process.exit(bad ? 1 : 0);
