=== WP Chat ===
Requires at least: 5.8
Requires PHP: 7.4
Stable tag: 0.4.0
License: GPL-2.0-or-later

Minimizable one-on-one chat widget connecting visitors directly to a switchboard-chat backend.

== Description ==
The visitor's browser talks directly to the backend. This WordPress site stores no message content and no visitor data; only plugin settings are saved. The backend sets a single cookie with a random identifier and deletes the conversation when the chat ends or after inactivity.

== Setup ==
1. Upload the wp-chat folder to wp-content/plugins and activate.
2. Settings > WP Chat: enter the backend HTTPS URL, the privacy contact and the privacy policy URL.
3. The backend must allow this site's origin (WEB_ALLOWED_ORIGINS). If the backend is on another domain, use a sub-domain of this site (e.g. chat.example.org) so the cookie is first-party.

== Language ==
The widget has French and English texts and, by default, follows the visitor's browser language (French if the browser prefers French, otherwise English). Settings > WP Chat > "Widget language" can also follow the site language or force French or English. Texts you customize (respondent name, retention sentence) are shown as typed in every language.

== Where the chat appears ==
Settings > WP Chat > "Show the chat on": all pages (default) or only the pages you tick, optionally also on blog posts.

== Privacy ==
No third-party scripts, fonts or analytics. Suggested privacy-policy text is registered under Settings > Privacy.
