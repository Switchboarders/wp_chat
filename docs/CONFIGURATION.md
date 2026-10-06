# WP Chat configuration reference

Everything is under **Settings → WP Chat**. The settings are stored in one WordPress option,
`wp_chat_options`. A status line at the top of the page tells you whether the chat is displayed
and why not, and **Test the chat server** checks the connection from your browser.

## Settings

| Setting | Option key | Default | Meaning |
|---|---|---|---|
| Backend URL (https) | `backend_url` | empty | Address of the switchboard-chat server, e.g. `https://chat.example.org`. **Must start with `https://`**; anything else is refused with an error. **Empty = the chat is not displayed.** |
| Name shown for the respondent | `agent_name` | Respondent / Répondant | One generic name for everyone, so the chat looks like a one-on-one conversation. |
| Accent color | `color` | `#2b6cb0` | Hex color of the bubble, header, buttons and visitor messages. |
| Privacy policy URL | `privacy_url` | empty | Link shown in the consent notice. |
| Person responsible for privacy | `privacy_officer` | empty | Name shown in the consent notice ("Privacy contact: …"). |
| Retention sentence | `retention_text` | "Your conversation is deleted when you end the chat or after 24 hours of inactivity." | Shown before the visitor starts. **Keep it equal to the server's `WEB_IDLE_TIMEOUT_MIN`.** |
| Quick exit URL | `quick_exit_url` | `https://www.google.com` | Where the "Quick exit" button sends the visitor (replacing the page in history) after ending the chat. Choose a neutral, ordinary site. |
| Widget language | `language_mode` | `auto` | See "Language". |
| Show the chat on | `display_mode`, `page_ids`, `include_posts` | all pages | See "Where the chat appears". |

## Language

The widget carries its texts in **French and English** and chooses in the visitor's browser, so page
caches and the site language never matter.

| Mode | Behavior |
|---|---|
| **Visitor's browser language** (`auto`, default) | Looks at the browser's language preference list in order and uses the first French (`fr`, `fr-CA`, `fr-FR`, …) or English entry. If the list has neither (e.g. only Spanish), falls back to the site language. |
| Site language (`site`) | French if the WordPress site language is French, otherwise English. |
| Always French / Always English (`fr` / `en`) | Forced for everyone. |

Customizing texts: the **respondent name** and the **retention sentence** are translated while they
keep their default values. If you type your own, it is shown exactly as typed to every visitor, in
every language. Other widget texts can be changed in `wp-chat/languages/widget-strings.json`.

The admin screens (this settings page, the suggested privacy text) follow the WordPress
language; French (Canada, France) is included.

## Where the chat appears

| Choice | Result |
|---|---|
| **All pages** (default) | On every page of the public site (not in the admin). |
| **Only the selected pages** | Only on the pages you tick in the list of published pages (sub-pages are indented). Optional box: **also on blog posts and the latest-posts home page**. Hidden everywhere else, including search results, archives and 404 pages. |

Notes:

- A page set as the site's "Posts page" is selectable like any page.
- If you choose "selected" and tick nothing, the chat is displayed nowhere; the status line warns you.
- Only published pages are listed. Other content types (products, custom post types) are not
  selectable; use "All pages" and a theme rule if you need them.

## Appearance

The widget is a fixed element at the bottom right (`#wp-chat-root`, `z-index: 99999`) styled by
`wp-chat/assets/chat.css`. To adjust it, add CSS in your theme (Appearance → Customize → Additional
CSS) rather than editing the plugin, which would be overwritten by updates. Useful hooks:

```css
#wp-chat-root { right: auto; left: 16px; bottom: 80px; }   /* move it */
.wpc-window   { width: 380px; height: 520px; }              /* size */
#wp-chat-root { --wpc-color: #1a7f5a; }                     /* color (the Accent color setting does this) */
```

Elements: `.wpc-bubble`, `.wpc-window`, `.wpc-head`, `.wpc-body`, `.wpc-msg` (`.wpc-mine`,
`.wpc-theirs`), `.wpc-notice`, `.wpc-form`, `.wpc-input`, `.wpc-send`, `.wpc-start`.

## Compatibility notes

- **Caching and optimization plugins:** safe. The page is identical for every visitor (the language
  is decided in the browser). Clear the cache after changing settings. Do not "defer"/"combine"
  the plugin's script in a way that runs it before the page body exists.
- **Content-Security-Policy:** allow your chat server in `connect-src` (the widget uses `fetch` and
  `EventSource`), e.g. `connect-src 'self' https://chat.example.org`. The widget's settings are
  passed in an inline script (`WPChatConfig`), so `script-src` must allow WordPress's inline
  scripts (a nonce or `'unsafe-inline'`, as for the rest of WordPress).
- **Multilingual plugins (WPML, Polylang):** the widget does not use them; language comes from
  the browser as above. Custom texts are not translated.
- **Multisite:** activate and configure per site.
- **Accessibility:** the window is a labeled dialog, new messages are announced through an
  `aria-live` region, and everything works from the keyboard.
- **Cookies:** the *chat server* sets the one cookie (`wpchat`); WordPress sets none for this plugin.
  It only keeps the conversation going; many policies treat that as strictly necessary, but decide this with whoever is responsible for privacy.
