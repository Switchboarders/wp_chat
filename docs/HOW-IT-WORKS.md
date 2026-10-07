**English** · [Français](fr/HOW-IT-WORKS.md)

# How WP Chat works

## Components

```
 Visitor's browser ──HTTPS──▶ reverse proxy ──▶ switchboard-chat ──▶ Matrix homeserver ◀── respondents
        ▲                                                                                (Element, …)
        └── loads the widget from WordPress (JS + CSS + settings only)
```

| Part | Role |
|---|---|
| **WP Chat plugin** (this project) | Adds the widget to your pages, stores its settings, provides the admin screen and the suggested privacy text. |
| **Widget** (`wp-chat/assets/chat.js`, plain JavaScript) | Runs in the visitor's browser: bubble, window, consent notice, messages. Talks **directly** to the chat server. |
| **Chat server** (switchboard-chat) | Receives visitor messages, creates an end-to-end encrypted Matrix room for the respondents, pushes their replies back. |
| **Respondents** | Answer from any Matrix client. |

WordPress is **not** in the message path: it never receives, relays or stores a message.

## What happens, step by step

1. A page loads. If the chat should be displayed on it (settings), the plugin adds the widget's
   CSS/JS and an empty container; the widget starts as a small bubble.
2. The visitor clicks the bubble: the window opens with the **consent notice** (what is kept, for how
   long, who to contact). Nothing is sent yet.
3. The visitor presses start: the widget calls the chat server (`POST /web/session`). The server
   checks that the page's origin is allowed, creates an in-memory session and returns a random
   session token, which the widget keeps in its memory and sends in an `Authorization` header (no cookie).
4. The widget opens a live connection (`GET /web/stream`, server-sent events) to receive replies.
5. The first message makes the server create the Matrix room and invite the active respondents.
   Each message is a `POST /web/message`.
6. A respondent's reply is pushed through the live connection and shown in the window.
7. The chat ends when the visitor presses **End chat** (`POST /web/end`) or closes the page, a
   respondent types `!fin`, the idle timeout passes, or the visitor's connection stays closed for a few
   minutes. The room is left and forgotten and the session disappears.

The API in detail is in the chat server's `docs/web-chat.md`.

## What is stored, and where

| Data | Where | Kept |
|---|---|---|
| Plugin settings | WordPress database (`wp_options`, key `wp_chat_options`) | until you delete the plugin |
| Message text | browser memory (the open window) and the chat server's memory in transit; Matrix room (encrypted) while the chat lasts | gone on reload (browser); never written to disk or logs by the server; room deleted at the end |
| Visitor identifier | session token in the widget's memory (no cookie, no browser storage); its hash in the chat server's memory | until the chat ends, the page is closed, or it times out |
| Visitor IP address | chat server memory, for rate limiting | at most one hour |
| Block list (only after a respondent uses `!ban`) | chat server database: keyed hash of the IPv4 address or IPv6 /64 network, and an end date | until the block expires (default 1 day); no reason, no content, no readable address |
| Block marker (only after a respondent blocks the visitor) | the blocked visitor's browser, `localStorage` key `wpchat_blocked`: a signed "blocked until" marker (two dates and a signature, no identifier) | until the block ends; the visitor can delete it |
| Anything about the visitor on WordPress | **nothing** | – |

The widget uses `localStorage` **only** for the block marker above, and no analytics, no third-party scripts or fonts. A page reload
loses the on-screen conversation by design (the server keeps no transcript to restore).

## Security model

- **Origin allow-list:** the server only answers the website addresses listed in `WEB_ALLOWED_ORIGINS`
  (CORS plus an explicit `Origin` check on every call), so another site cannot use a visitor's session.
- **Session token:** random, kept only in the widget's memory (not in a cookie or any browser storage) and
  sent in an `Authorization` header over HTTPS; the server keeps only its hash. Unlike an HTTP-only cookie
  it is readable by script running in the page, so keep WordPress and its plugins up to date.
- **Limits:** message size and rate, new sessions per IP and simultaneous chats are capped by the server.
- **Abuse controls:** respondents can block a visitor (`!ban`): the server refuses that connection for a while and
  the visitor's browser keeps a signed marker so a new VPN does not help. When there has been abuse lately, the
  widget first solves a short computation (proof of work) before a chat starts; it uses no third-party service.
- **Output:** respondent text is displayed as plain text (`textContent`), never as HTML.
- **Confidentiality:** the Matrix room is end-to-end encrypted; the browser-to-server link is HTTPS.
  The "one-on-one" appearance is deliberate: the visitor sees one generic respondent name.

## Browser support

Any current browser with `fetch` response streaming (Chrome, Edge, Firefox, Safari, Samsung Internet).
Because no cookie is used, browsers' third-party cookie and tracking-protection settings do not affect
the chat, and the chat server may be on any domain.

## Related documents

[INSTALL.md](INSTALL.md) · [CONFIGURATION.md](CONFIGURATION.md) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) ·
[law25.md](law25.md)
