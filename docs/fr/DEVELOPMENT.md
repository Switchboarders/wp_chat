[English](../DEVELOPMENT.md) · **Français**

# Développer WP Chat

## Organisation

```
wp-chat/                  le module (c’est ce dossier qui s’installe)
  wp-chat.php             en-tête, crochets, texte de la politique de confidentialité
  includes/settings.php   options, assainissement, page d’administration, avis d’état, bouton d’essai
  includes/render.php     « le clavardage doit-il s’afficher ici? », ajout des ressources, transmission de la configuration
  assets/chat.js          le module de clavardage (JS simple, sans étape de compilation, sans dépendance)
  assets/chat.css         styles (tous les sélecteurs commencent par .wpc- ou #wp-chat-root)
  languages/              widget-strings.json (textes du module, en + fr) et .po/.mo (écrans d’administration)
  uninstall.php           supprime l’option
dev/                      site WordPress d’essai sous Docker (port 8085)
tests/                    tests Node (sans dépendance)
docs/                     documentation (docs/fr/ pour le français)
```

Il n’y a volontairement **aucune étape de compilation, aucun Composer ni aucune dépendance npm** : le
module doit s’installer sur n’importe quel hébergement WordPress.

## Site d’essai local

```bash
cd dev
docker compose up -d
docker compose run --rm setup            # la première fois : installe WordPress, active le module
```

Site : <http://localhost:8085>, administrateur `admin` / `admin` (pas pour la production). Le dossier du
module est monté en direct. L’URL du serveur est `https://localhost:3443` par défaut (le port HTTPS de
switchboard-chat; visitez-le une fois dans le navigateur pour accepter son certificat autosigné), et le
serveur a besoin de `WEB_ALLOWED_ORIGINS=http://localhost:8085`. Lancez wp-cli avec
`docker compose run --rm -T setup "wp option get wp_chat_options --format=json"`.
Tout réinitialiser : `docker compose down -v`.

## Tests

```bash
node tests/widget-language.test.js       # choix de la langue par le vrai code du module, face à une page simulée
node tests/sse-parser.test.js            # l’analyseur de text/event-stream (blocs découpés n’importe où)
node tests/widget-flow.test.js           # vraie diffusion fetch face à un faux serveur de clavardage : en-tête du jeton, reconnexion, 401, avis de fermeture, repli vers un ancien serveur
for f in wp-chat/*.php wp-chat/includes/*.php; do php -l "$f"; done
```

`widget-language.test.js` exécute `assets/chat.js` dans un bac à sable avec un faux document et vérifie la
langue choisie pour différentes listes de langues du navigateur, langues du site et modes imposés.

## Conventions

- Compatible PHP 7.4, style de code WordPress (tabulations), toute sortie échappée (`esc_html`, `esc_attr`).
- Chaque texte d’administration destiné à l’utilisateur passe par `__()` avec le domaine de texte
  `wp-chat`; ajoutez le français à `languages/wp-chat-fr_CA.po` et recompilez
  (`msgfmt -o wp-chat-fr_CA.mo wp-chat-fr_CA.po`; `wp-chat-fr_FR` est le même fichier avec un autre
  en-tête `Language:`).
- Les textes du module vivent dans `languages/widget-strings.json` (mêmes clés dans `en` et `fr`).
- Le texte des répondants s’insère avec `textContent`, jamais avec `innerHTML`.
- Le module ne stocke rien dans le navigateur (ni `localStorage`, ni témoin qui lui soit propre).
- **Documentation bilingue :** chaque document de `docs/` et chaque fichier racine a une version française
  dans `docs/fr/` (ou `*.fr.md`) avec le même plan. Modifiez les deux ensemble.

## Publication

1. Augmentez la version dans `wp-chat/wp-chat.php` (l’en-tête **et** `WP_CHAT_VERSION`) et dans
   `wp-chat/readme.txt`.
2. Ajoutez une entrée à `CHANGELOG.md` et à `CHANGELOG.fr.md`.
3. `zip -r wp-chat.zip wp-chat -x "*.DS_Store"`, installez-le sur le site d’essai, lancez les vérifications
   ci-dessus.
4. Validez (commit) et étiquetez.
