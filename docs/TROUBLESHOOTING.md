**English** · [Français](fr/TROUBLESHOOTING.md)

# WP Chat troubleshooting

Start at **Settings → WP Chat**. The coloured line at the top says whether the chat is displayed and
why not, and **Test the chat server** reports whether the server answers and accepts your website.
Then work through the table, and use the browser's developer tools (F12) for the details below.

## Quick table

| Symptom | Likely cause → what to do |
|---|---|
| **No button on any page** | The plugin is not activated, or the Backend URL is empty (red line on the settings page). Note that a URL that does not start with `https://` is rejected with an error and not saved. |
| **No button on some pages** | "Only the selected pages" is on and the page is not ticked; or the page is a blog post / home page (tick "Also show on blog posts…"). Search, archive and 404 pages are never included in that mode. |
| **Button shows, but "Connection problem" on start** | The chat server is unreachable, the address is wrong, or your site's origin is not in the server's `WEB_ALLOWED_ORIGINS` (exact match, e.g. `https://www.example.org` ≠ `https://example.org`). See "Reading the browser's Network tab". |
| **"Test the chat server" says it cannot reach the server** | Same causes. HTTPS must be valid (an expired or self-signed certificate is refused by browsers). |
| **Visitor can send, replies never appear** | A proxy in front of the chat server buffers the live stream. Follow the streaming test in the server's `docs/reverse-proxy.md`. Also check the respondent actually answered in the right room. |
| **"No respondent available" / error 503** | No active respondent on the server's `WEB_CALL_CENTER_ID`, or the server is not configured. |
| **"Connection problem" right after the first message** | The server answered `401`: it does not accept the session token. Either the chat server is older than widget 0.5.0 and the browser blocks its cookie (update the server), or the chat already ended / expired / the server restarted. See "Reading the browser's Network tab". |
| **Works for a while then "Connection problem"** | The chat expired (idle timeout) or the server restarted: web chats live in memory. Start a new chat. |
| **Many visitors get "rate limited"** | The server sees the proxy's address for everyone: the proxy must forward `X-Forwarded-For` (server docs). |
| **Button hidden behind a cookie banner or another widget** | Move it with CSS (see CONFIGURATION.md, "Appearance"). |
| **Nothing changes after editing settings** | A page cache serves the old page: clear it. |
| **Plugin not listed after a file copy** | The folder is nested too deep. The file must be `wp-content/plugins/wp-chat/wp-chat.php`. |
| **Widget does not load, console mentions CSP** | Allow your chat server in `connect-src` and WordPress's inline script (CONFIGURATION.md, "Compatibility notes"). |
| **Text in the wrong language** | See "Language" in CONFIGURATION.md: the default follows the **browser**; check the Widget language setting and the browser's language list. |

## Reading the browser's Network tab

Open the site in a private window, open developer tools → **Network**, click the chat button,
accept the notice and send a message. Look at the requests to the chat server:

| Request | Healthy | If not |
|---|---|---|
| `session` (POST) | `200`, JSON body with a `token` | `403 origin_not_allowed`: origin missing from `WEB_ALLOWED_ORIGINS`. `503`: server not configured or no respondent. `(blocked)` / CORS error in the console: wrong address, no HTTPS, or the origin is not allowed. |
| `message` (POST) | `200` | `401`: no valid token (the chat ended, expired or the server restarted), or a server too old for this widget (upgrade it). `429`: rate limit. |
| `stream` (GET, type `fetch`) | stays **pending** (open) and shows incoming messages | `401`: no valid token. Ends immediately: a proxy or firewall cuts it. Shows nothing when a reply is sent: buffering. |

Token: the `message` and `stream` requests must carry a request header `authorization: Bearer …`. If it
is missing, the `session` answer had no `token` (a chat server older than widget 0.5.0, which then works
with cookies; some browsers block them).

## Still stuck?

Collect: the status line text from the settings page, the result of the **Test the chat server**
button, the failing request's status code and the console message, and whether the problem
happens in a private window and in another browser. With those, the cause is almost always visible.
