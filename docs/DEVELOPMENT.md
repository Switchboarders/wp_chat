# Developing WP Chat

## Layout

```
wp-chat/                  the plugin (this folder is what gets installed)
  wp-chat.php             header, hooks, privacy policy text
  includes/settings.php   options, sanitizing, admin page, status notice, test button
  includes/render.php     "should the chat be displayed here?", enqueues assets, passes config
  assets/chat.js          the widget (plain JS, no build step, no dependencies)
  assets/chat.css         styles (all selectors start with .wpc- or #wp-chat-root)
  languages/              widget-strings.json (widget texts, en + fr) and .po/.mo (admin screens)
  uninstall.php           removes the option
dev/                      Docker WordPress test site (port 8085)
tests/                    Node tests (no dependencies)
docs/                     documentation
```

There is deliberately **no build step, Composer or npm dependency**: the plugin must install on any
WordPress host.

## Local test site

```bash
cd dev
docker compose up -d
docker compose run --rm setup            # first time: installs WordPress, activates the plugin
```

Site: <http://localhost:8085>, admin `admin` / `admin` (not for production). The plugin folder is
mounted live. The Backend URL defaults to `https://localhost:3443` (switchboard-chat's HTTPS port;
visit it once in the browser to accept its self-signed certificate) and the server needs
`WEB_ALLOWED_ORIGINS=http://localhost:8085`. Run wp-cli with
`docker compose run --rm -T setup "wp option get wp_chat_options --format=json"`.
Reset everything: `docker compose down -v`.

## Tests

```bash
node tests/widget-language.test.js       # language selection of the real widget code against a stubbed page
for f in wp-chat/*.php wp-chat/includes/*.php; do php -l "$f"; done
```

`widget-language.test.js` runs `assets/chat.js` in a sandbox with a fake document and checks the
language chosen for different browser language lists, site languages and forced modes.

## Conventions

- PHP 7.4 compatible, WordPress coding style (tabs), every output escaped (`esc_html`, `esc_attr`).
- Every user-facing admin string goes through `__()` with the `wp-chat` text domain; add French to
  `languages/wp-chat-fr_CA.po` and recompile (`msgfmt -o wp-chat-fr_CA.mo wp-chat-fr_CA.po`;
  `wp-chat-fr_FR` is the same file with another `Language:` header).
- Widget texts live in `languages/widget-strings.json` (same keys in `en` and `fr`).
- Respondent text is inserted with `textContent`, never `innerHTML`.
- The widget stores nothing in the browser (no `localStorage`/cookies of its own).

## Release

1. Bump the version in `wp-chat/wp-chat.php` (header **and** `WP_CHAT_VERSION`) and `wp-chat/readme.txt`.
2. Add an entry to `CHANGELOG.md`.
3. `zip -r wp-chat.zip wp-chat -x "*.DS_Store"`, install it on the test site, run the checks above.
4. Commit and tag.
