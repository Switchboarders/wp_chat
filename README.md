**English** · [Français](README.fr.md)

# WP Chat

A WordPress plugin that adds a **minimizable, one-on-one chat window** to your website. A visitor talks,
in real time and in confidence, with a team of respondents who answer from Matrix (Element or any
Matrix client). Built for support lines (for example 12-step programs) where the visitor must stay
anonymous and the conversation must stay confidential.

- **WordPress stores nothing about the conversation.** The visitor's browser talks directly to the
  chat server ([switchboard-chat](https://github.com/Switchboarders/SwitchBoardChat)); the plugin only
  serves the widget and keeps its settings.
- **Looks like one person.** The visitor sees a single generic respondent name; a team answers.
- **Private by design.** Messages are never written to disk or logs by the server, rooms are
  end-to-end encrypted and deleted when the chat ends or goes idle. Notes for Quebec Law 25 in
  [docs/law25.md](docs/law25.md).
- **Runs on any WordPress host.** PHP + plain JavaScript, no build step, no dependencies, no shell
  access needed.
- **French and English**, following the visitor's browser language.
- Choose **all pages or selected pages**; accessible dialog.

```
 Visitor's browser ──HTTPS──▶ reverse proxy ──▶ switchboard-chat ──▶ Matrix ◀── respondents
        ▲
        └── loads the widget from WordPress
```

## Quick start

1. Set up the chat server (switchboard-chat `docs/web-chat.md`, `docs/reverse-proxy.md`) and allow your
   website's address in its `WEB_ALLOWED_ORIGINS`.
2. Install the plugin: `zip -r wp-chat.zip wp-chat`, then Plugins → Add New → Upload.
3. Settings → WP Chat: enter the chat server's `https://` address, the privacy contact and policy
   URL, save, press **Test the chat server**.
4. Open the site in a private window and try a chat.

Full steps: [docs/INSTALL.md](docs/INSTALL.md).

## Documentation

| | |
|---|---|
| [docs/INSTALL.md](docs/INSTALL.md) | requirements, installation, first configuration, testing, updating |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | every setting, language, where the chat appears, appearance, compatibility |
| [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md) | components, message flow, what is stored where, security model |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | symptoms and fixes, reading the browser's network tab |
| [docs/law25.md](docs/law25.md) | privacy notes (Quebec Law 25) |
| [docs/law25-website-template.md](docs/law25-website-template.md) | **template to adapt**: privacy policy section, chat notice, request procedure, volunteer commitment, incident register, impact assessment |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | layout, local test site, tests, conventions, releasing |
| [CHANGELOG.md](CHANGELOG.md) | versions |

## Repository layout

`wp-chat/` is the plugin (the folder to install) · `dev/` a Docker test site · `tests/` Node tests · `docs/`.

## Contributing and security

Issues and pull requests are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). Report security problems
privately, never in a public issue: see [SECURITY.md](SECURITY.md).

## License

Copyright (C) 2026 Switchboarders. Free software under the **GNU General Public License, version 2 or (at
your option) any later version** (GPL-2.0-or-later), like WordPress itself: see [LICENSE](LICENSE).
