**English** · [Français](CHANGELOG.fr.md)

# Changelog

## 0.9.0
- **Link this website to a committee with one string, nothing to set up on the server.** In SwitchBoard, the
  committee's *SwitchBoard Chat* page shows a string such as `https://chat.example.org#K7QM-3XRA-PW2D` (valid 30
  minutes, used once). Paste it in *Settings > WP Chat > Link this website to a committee*: the plugin fills in the
  Backend URL, and the chat server accepts this website and sends its chats to that committee. Needs
  switchboard-chat with `POST /web/pair`. A Backend URL typed by hand (with `WEB_ALLOWED_ORIGINS` on the server)
  keeps working.
- **Open source.** Published under the GNU GPL, version 2 or later (LICENSE file), by Switchboarders.
  Added SECURITY.md (private vulnerability reporting) and CONTRIBUTING.md; plugin header with Plugin URI,
  author and license URI.

## 0.8.1
- When nobody is on duty, the widget shows the call center's `no_respondent` macro (the same text SMS callers
  receive), set in SwitchBoard. Without such a macro it keeps its own sentence. The administrator's *Extra text
  when the chat is unavailable* is still shown under it. Needs switchboard-chat with this feature.

## 0.8.0
- **The chat survives a reload or a move to another page of the site.** The widget keeps the anonymous session code
  in the browser (`sessionStorage` = this tab only, the default; `localStorage` with the new setting *Keep the chat
  open across pages* = whole browser) and restores the conversation from the chat server (`GET /web/history`,
  held in the server's memory only). Messages are never stored in the browser.
- Closing or leaving the page no longer ends the chat (the end-of-page beacon is gone). Chats end when the visitor
  presses End chat, a respondent types `!fin`, or after **48 hours** without activity.
- Default retention sentence is now 48 hours (sites that kept the old default are updated automatically).
- Requires switchboard-chat with `/web/history`; with an older server a reload simply starts over.

## 0.7.0
- A blocked visitor's browser keeps a signed "blocked until" marker (`localStorage` key `wpchat_blocked`, only after a
  block) and sends it when asking for a new chat, so changing VPN or network no longer gets around a ban.
- Proof-of-work challenge: when the chat server asks (after abuse, or when one address opens several chats), the
  widget solves a short computation before the chat starts ("Checking your connection…"). No third-party service.
- Requires switchboard-chat with the same features; older servers keep working without them.

## 0.6.0
- Clear messages for a visitor who cannot be served: blocked connection (`!ban` by a respondent), nobody
  available, chat busy, or too many attempts.
- New setting *Extra text when the chat is unavailable* (for example another number to call), shown with those
  messages.
- Works with switchboard-chat's abuse protection (`!ban`, `WEB_SESSIONS_PER_IP_PER_HOUR`, `web_unban`).

## 0.5.0
- **No more cookie.** The widget keeps a session token in its own memory and sends it in an `Authorization`
  header; the live stream uses `fetch` streaming instead of `EventSource`. The chat now works in browsers that
  block third-party cookies (Samsung Internet, Safari, Firefox strict mode) whatever the domain of the chat server.
- Closing the page ends the chat (end beacon); reconnects automatically if the stream drops; a `401` ends the chat.
- Falls back to cookies + `EventSource` with a chat server older than the token mode.
- Requires switchboard-chat with token sessions for the best behavior (it also works with older servers).

## 0.4.0
- Removed the "Quick exit" button and its "Quick exit URL" setting (a leftover saved value is deleted
  automatically).

## 0.3.0
- The widget follows the visitor's browser language (French or English) by default. New setting
  "Widget language": browser, site language, always French, always English.
- Widget texts shipped in both languages (`languages/widget-strings.json`); customized respondent name and
  retention sentence are shown as typed.
- `fr_FR` admin translation added.

## 0.2.1
- Settings page status line explaining why the chat is hidden (empty URL, no page selected).
- A Backend URL that is not `https://` now shows an error instead of being dropped silently.
- "Test the chat server" button (reachability and CORS from the administrator's browser).

## 0.2.0
- Choose where the chat appears: all pages or selected pages, optionally blog posts.

## 0.1.0
- First version: minimizable one-on-one chat widget, consent notice, end chat, quick exit,
  French (Canada) translation, suggested privacy-policy text.
