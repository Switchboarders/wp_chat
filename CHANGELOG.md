**English** · [Français](CHANGELOG.fr.md)

# Changelog

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
