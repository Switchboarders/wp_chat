# Installing WP Chat

WP Chat is a WordPress plugin that adds a chat bubble to your website. It needs a running
**switchboard-chat** server (the "chat server") that it talks to directly from the visitor's
browser. Set the server up first: see the switchboard-chat documentation
(`docs/web-chat.md` and `docs/reverse-proxy.md` in that project).

## Requirements

| | |
|---|---|
| WordPress | 5.8 or newer (single site or multisite; activate per site) |
| PHP | 7.4 or newer (no extensions, no Composer, no shell access) |
| Chat server | reachable over **HTTPS** from visitors, with your website's address in its `WEB_ALLOWED_ORIGINS` and the chat streaming correctly (checks in its `web-chat.md`, section 4) |
| Browsers | current Chrome, Edge, Firefox, Safari (needs `fetch` and `EventSource`); not Internet Explorer |

Before you start, have these two values:

- **Chat server address**, e.g. `https://chat.example.org` (https, no trailing slash).
- **Your website's address as visitors see it**, e.g. `https://www.example.org`. It must be
  listed *exactly* in the server's `WEB_ALLOWED_ORIGINS` (`https://www.example.org` and
  `https://example.org` are different origins; list both if both exist).

## 1. Get the plugin

Build the zip from a checkout of this repository:

```bash
zip -r wp-chat.zip wp-chat -x "*.DS_Store"
```

(The zip must contain a single top folder named `wp-chat`. Do **not** zip the whole repository.)

## 2. Install and activate

Pick one:

- **WordPress admin:** Plugins → Add New → Upload Plugin → choose `wp-chat.zip` → Install Now → Activate.
- **File copy (FTP/SFTP/SSH):** copy the `wp-chat` folder to `wp-content/plugins/`, then activate it
  under Plugins. If you copied the repository instead, make sure the path is
  `wp-content/plugins/wp-chat/wp-chat.php` (not `…/wp_chat/wp-chat/wp-chat.php`): WordPress only
  finds plugins one folder deep.
- **WP-CLI:** `wp plugin install wp-chat.zip --activate`

File ownership must let the web server read the files (normally `644` for files, `755` for folders).

## 3. Configure

Settings → **WP Chat**. The first line of the page says in plain words whether the chat is
displayed, and why not. At minimum:

1. **Backend URL (https)**: your chat server address. Anything not starting with `https://` is
   refused with an error.
2. **Person responsible for privacy** and **Privacy policy URL**: shown in the consent notice
   (needed for Quebec Law 25 and similar rules).
3. Press **Save**, then **Test the chat server**. A green "answers and accepts this website"
   means the address, HTTPS and the origin allow-list are right.

All options are described in [CONFIGURATION.md](CONFIGURATION.md). The chat stays **hidden until a
Backend URL is saved**.

Without the admin screen (scripted installs), the settings are one option:

```bash
wp option update wp_chat_options '{"backend_url":"https://chat.example.org","privacy_officer":"Jane Doe","privacy_url":"https://www.example.org/privacy","display_mode":"all"}' --format=json
```

## 4. Try it (5 minutes)

1. Open your site in a **private window**: a round chat button appears at the bottom right.
2. Click it, read the notice, press the start button and send a message.
3. A respondent opens the new room in their Matrix client and answers; the answer appears in the widget.
4. The respondent types `!fin` (or the visitor presses **End chat**): the widget says the chat ended.
5. In the browser's developer tools (Application → Cookies, for the *chat server's* domain) there is
   one cookie `wpchat`; WordPress's own storage holds nothing about the visitor.

## 5. Privacy text

The plugin adds a suggested paragraph in Settings → Privacy → Policy Guide ("WP Chat"). Copy it into
your privacy policy and add who answers, the retention period and the privacy contact. If
you also offer SMS, say that texts transit through the SMS provider and the mobile carriers.

## 6. Updating and removing

- **Update:** Plugins → Add New → Upload Plugin → choose the new zip → "Replace current with
  uploaded". Settings are kept.
- **Remove:** Deactivate, then Delete. The only stored data (`wp_chat_options`) is removed on delete.
  Visitors' conversations never touched WordPress, so there is nothing else to clean.

## 7. If something does not work

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md). The most common causes: an empty or non-https Backend
URL, the website's origin missing from the server's `WEB_ALLOWED_ORIGINS`, and a reverse proxy that
buffers the live stream so replies never show.
