**English** · [Français](#contribuer)

# Contributing

Thank you for helping. WP Chat is used by helplines: changes must keep the visitor anonymous and the
conversation confidential.

- **Ground rules.** WordPress stores no conversation and no visitor data (only the plugin's settings); the
  browser keeps no message. No build step, Composer or npm dependency: the plugin must install on any
  WordPress host by uploading the `wp-chat/` folder. French and English texts change together.
- **Before a pull request**: run the Node tests (`node tests/<name>.test.js`, see
  [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)) and try the change on the Docker test site in `dev/`.
  Describe what you changed and how you tested it, and add a line to `CHANGELOG.md` and `CHANGELOG.fr.md`.
- **Security problems** are never reported in public: see [SECURITY.md](SECURITY.md).
- By contributing you agree that your contribution is licensed under the project's license,
  GPL-2.0-or-later ([LICENSE](LICENSE)).

---

# Contribuer

Merci de votre aide. WP Chat sert à des lignes d’écoute : un changement doit garder le visiteur anonyme et la
conversation confidentielle.

- **Règles de base.** WordPress ne conserve aucune conversation ni donnée du visiteur (seulement les réglages
  du module); le navigateur ne garde aucun message. Aucune étape de construction ni dépendance Composer ou npm :
  le module doit s’installer sur n’importe quel hébergement WordPress en téléversant le dossier `wp-chat/`. Les
  textes français et anglais changent ensemble.
- **Avant une demande de fusion** : lancez les tests Node (`node tests/<nom>.test.js`, voir
  [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)) et essayez le changement sur le site d’essai Docker de `dev/`.
  Décrivez le changement et comment vous l’avez testé, et ajoutez une ligne à `CHANGELOG.md` et `CHANGELOG.fr.md`.
- **Les problèmes de sécurité** ne se signalent jamais en public : voir [SECURITY.md](SECURITY.md).
- En contribuant, vous acceptez que votre contribution soit sous la licence du projet, GPL-2.0-or-later
  ([LICENSE](LICENSE)).
