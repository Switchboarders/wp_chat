# Installing the WP Chat plugin on WordPress

Do this **after** the backend is upgraded and answers correctly (`VPS-UPGRADE.md`, step 6.3).
Requirements: WordPress 5.8+, PHP 7.4+, admin account. No Composer, no shell access, no extra package.

## 1. Build the plugin zip (on your machine)

```bash
cd ~/wp_chat
zip -r wp-chat.zip wp-chat -x "*.DS_Store"
```

## 2. Install

1. WordPress admin → **Plugins → Add New → Upload Plugin** → choose `wp-chat.zip` → **Install Now** → **Activate**.
   (No upload possible? Unzip and copy the `wp-chat` folder to `wp-content/plugins/` by FTP/SFTP.)
2. **Settings → WP Chat** and fill in:

| Field | Value |
|---|---|
| Backend URL (https) | `https://sbchat.aideaa.ca` (no trailing slash, **must be https**) |
| Name shown for the respondent | e.g. `Répondant` / `Respondent`. One name for everyone: it looks like a one-on-one chat |
| Accent color | your brand color, e.g. `#2b6cb0` |
| Privacy policy URL | page that describes this chat (see `law25.md`, section 4) |
| Person responsible for privacy | name shown in the consent notice (required by Law 25) |
| Retention sentence | must match the backend: `WEB_IDLE_TIMEOUT_MIN` (default 24 h) |
| Quick exit URL | where the "Quick exit" button sends the visitor (default a neutral site) |
| Widget language | **Visitor's browser language** (default), site language, always French, or always English |
| Show the chat on | **All pages** (default), or **Only the selected pages**: tick the pages in the list (sub-pages are indented). Optionally tick "Also show on blog posts and the latest-posts home page". With "selected", the chat is hidden everywhere else, including search results and archives |

The widget stays **invisible until the Backend URL is set**.

3. **Language**: by default the widget follows the **visitor's browser language**: French if the browser prefers French (any `fr-*`), otherwise English. The first supported language in the browser's preference list wins; other languages fall back to the site language. *Settings → WP Chat → Widget language* can instead follow the site language, or force always French / always English. The respondent name and the retention sentence are translated while they keep their default text; if you type your own, it is shown as typed in every language (and the retention sentence must match `WEB_IDLE_TIMEOUT_MIN`). The admin screens still follow the WordPress language (French Canada and France included).

## 3. Test (5 minutes)

1. Open the site in a **private window**. A round chat button appears at the bottom right.
2. Click it, read the notice, press the start button, send a message.
3. In Matrix, a room named **"Web …"** appears for the respondents; reply in it. The reply shows in the widget.
4. A respondent types `!fin`, or the visitor presses **End chat**: the widget says the chat ended,
   and the bot has left the room.
5. In the browser dev tools (F12 → Application → Cookies → the backend domain) you should see
   one cookie `wpchat`, and **nothing** under the WordPress site's own storage.

## 4. Things that commonly go wrong

| Symptom | Fix |
|---|---|
| No button on one page | "Only the selected pages" is on and that page is not ticked (or it is a blog post/home page: tick the extra checkbox) |
| No button | Backend URL empty, or a cache/optimization plugin serves an old page: clear the cache |
| "Connection problem" at start | Backend URL not https, wrong host, or `WEB_ALLOWED_ORIGINS` on the backend does not exactly equal this site's address (`https://www.site.ca` ≠ `https://site.ca`; add both, comma separated) |
| Works on your machine, not in Safari/Firefox private mode | the browser blocks third-party cookies: the backend should be a sub-domain of the **same registrable domain** as the site (e.g. WordPress `www.aideaa.ca`, backend `sbchat.aideaa.ca`) |
| "No respondent available" | no active respondent for `WEB_CALL_CENTER_ID`; activate respondents |
| Messages sent, replies never arrive | nginx in front of the backend buffers the stream: see `VPS-UPGRADE.md` step 4 |
| Button hidden behind a cookie banner / other widget | adjust `z-index` / position in `assets/chat.css` (`#wp-chat-root`) |
| Conflicts with a security plugin (CSP) | allow `connect-src https://sbchat.aideaa.ca` and `script-src 'self'` in the site's Content-Security-Policy |

## 5. Privacy policy text

The plugin adds a suggested paragraph to **Settings → Privacy → Policy Guide** (section "WP Chat").
Copy it into your privacy policy page and add: who answers, the retention period, the privacy
contact, that SMS (if offered on the same page) transit through voip.ms and the carriers.

## 6. Updating or removing

- **Update**: upload the new zip over the old plugin (Upload Plugin → "Replace current with uploaded").
- **Remove**: Deactivate → Delete. Only the plugin settings (`wp_chat_options`) are stored and are removed on delete.
  Visitors' chats never touched WordPress.

## 7. Local test site (optional, for developers)

`dev/` contains a Docker WordPress on port 8085: `cd dev && docker compose up -d && docker compose run --rm setup`
(see `dev/README.md`). Admin: `admin` / `admin`. Not for production.
