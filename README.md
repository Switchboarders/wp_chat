# wp_chat

WordPress chat widget for **switchboard-chat**: a visitor opens a minimized chat bubble and talks,
in real time and in confidence, with a team of respondents who answer from Matrix.

```
 Visitor browser ──HTTPS + SSE──▶ nginx ──▶ switchboard-chat ──▶ Matrix (Synapse) ◀── respondents
        ▲                                         │
        └── loads widget from WordPress           └── SMS: voip.ms ◀──▶ callers' phones
```

- WordPress only serves the widget and its settings. **It never sees a message.**
- The browser talks directly to the backend (`/web/session`, `/web/message`, `/web/stream`, `/web/end`).
- Nothing is written to disk by the bridge for web chats; the conversation is deleted when the chat
  ends or after an idle timeout. Quebec Law 25 notes are in `docs/law25.md`.

## Contents

| Path | What |
|---|---|
| `wp-chat/` | the WordPress plugin (PHP + vanilla JS/CSS, no build step) |
| `dev/` | Docker WordPress test site on port 8085 |
| `docs/INSTALL-WORDPRESS.md` | install the plugin on a real WordPress site |
| `docs/law25.md` | what is stored where, rights, notices, incident procedure, PIA checklist |
| backend repo `docs/VPS-UPGRADE.md` | upgrade the VPS (Law 25 + web chat), verify, roll back |

## Install order

1. Back up the VPS.
2. Upgrade the backend: `docs/VPS-UPGRADE.md` (switchboard-chat repository).
3. Install the plugin: `docs/INSTALL-WORDPRESS.md`.
4. Review `docs/law25.md` with whoever is responsible for privacy.
