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
   session token, which the widget keeps in the browser (`sessionStorage`) and sends in an `Authorization` header (no cookie).
4. The widget opens a live connection (`GET /web/stream`, server-sent events) to receive replies.
5. The first message makes the server create the Matrix room and invite the active respondents.
   Each message is a `POST /web/message`.
6. A respondent's reply is pushed through the live connection and shown in the window.
7. Reloading the page or moving to another page of the site does **not** end the chat: the widget keeps the
   session code in the browser (this tab only, by default), asks the server for the conversation so far
   (`GET /web/history`), shows it again and reconnects to the live stream.
8. The chat ends when the visitor presses **End chat** (`POST /web/end`), a respondent types `!fin`, **48 hours**
   pass without any activity (`WEB_IDLE_TIMEOUT_MIN`), or nothing is written for 10 minutes after the chat was opened. The
   server removes every respondent from the Matrix room, leaves and forgets it, so the room disappears from
   the respondents' clients, and the session is gone.

The API in detail is in the chat server's `docs/web-chat.md`.

## What is stored, and where

| Data | Where | Kept |
|---|---|---|
| Plugin settings | WordPress database (`wp_options`, key `wp_chat_options`) | until you delete the plugin |
| Message text | browser memory (the open window); the chat server's **memory** (the last 300 lines, so a reload can restore them); Matrix room (encrypted) while the chat lasts | never written to disk or logs by the server; erased from memory and the room deleted when the chat ends or after 48 h without activity |
| Visitor identifier | session token in the browser (`sessionStorage` key `wpchat_session`, or `localStorage` if you chose "whole browser"), and its hash in the chat server's memory; no cookie | until the chat ends or 48 h without activity |
| Visitor IP address | chat server memory, for rate limiting | at most one hour |
| Block list (only after a respondent uses `!ban`) | chat server database: keyed hash of the IPv4 address or IPv6 /64 network, and an end date | until the block expires (default 1 day); no reason, no content, no readable address |
| Block marker (only after a respondent blocks the visitor) | the blocked visitor's browser, `localStorage` key `wpchat_blocked`: a signed "blocked until" marker (two dates and a signature, no identifier) | until the block ends; the visitor can delete it |
| Anything about the visitor on WordPress | **nothing** | – |

The widget stores in the browser **only** the session code above (never the messages) and, after a block, the block marker; it uses no analytics and no third-party scripts or fonts. The conversation shown after a reload comes back from the chat server's memory, not from the browser.

## Security model

- **Origin allow-list:** the server only answers the website addresses listed in `WEB_ALLOWED_ORIGINS`
  (CORS plus an explicit `Origin` check on every call), so another site cannot use a visitor's session.
- **Session token:** random, kept in the browser's `sessionStorage` (or `localStorage`), never in a cookie, and
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
