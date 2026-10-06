[English](README.md) · **Français**

# WP Chat

Un module WordPress qui ajoute à votre site Web une **fenêtre de clavardage réductible, en tête-à-tête**.
Un visiteur discute, en temps réel et en toute confidentialité, avec une équipe de répondants qui
répondent depuis Matrix (Element ou tout autre client Matrix). Conçu pour les lignes d’écoute (par
exemple les programmes en 12 étapes), où le visiteur doit rester anonyme et la conversation, confidentielle.

- **WordPress ne stocke rien de la conversation.** Le navigateur du visiteur parle directement au serveur
  de clavardage ([switchboard-chat](https://github.com/Switchboarders/SwitchBoardChat)); le module ne fait
  que servir le widget et conserver ses réglages.
- **Donne l’impression d’une seule personne.** Le visiteur voit un seul nom de répondant générique; c’est
  une équipe qui répond.
- **Confidentiel par conception.** Le serveur n’écrit jamais les messages sur disque ni dans ses journaux,
  les salles sont chiffrées de bout en bout et supprimées quand le clavardage se termine ou devient
  inactif. Notes sur la Loi 25 du Québec dans [docs/fr/law25.md](docs/fr/law25.md).
- **Fonctionne sur n’importe quel hébergement WordPress.** PHP + JavaScript simple, sans étape de
  compilation, sans dépendance, sans accès à un terminal.
- **Français et anglais**, selon la langue du navigateur du visiteur.
- Choix de **toutes les pages ou de pages sélectionnées**; boîte de dialogue accessible.

```
 Navigateur du visiteur ──HTTPS──▶ proxy inverse ──▶ switchboard-chat ──▶ Matrix ◀── répondants
        ▲
        └── charge le module depuis WordPress
```

## Démarrage rapide

1. Installez le serveur de clavardage (switchboard-chat `docs/fr/web-chat.md`, `docs/fr/reverse-proxy.md`)
   et autorisez l’adresse de votre site Web dans son `WEB_ALLOWED_ORIGINS`.
2. Installez le module : `zip -r wp-chat.zip wp-chat`, puis Extensions → Ajouter → Téléverser.
3. Réglages → WP Chat : entrez l’adresse `https://` du serveur de clavardage, la personne-ressource en
   matière de confidentialité et l’URL de la politique, enregistrez, puis appuyez sur **Tester le serveur
   de clavardage**.
4. Ouvrez le site dans une fenêtre de navigation privée et essayez un clavardage.

Étapes complètes : [docs/fr/INSTALL.md](docs/fr/INSTALL.md).

## Documentation

| | |
|---|---|
| [docs/fr/INSTALL.md](docs/fr/INSTALL.md) | prérequis, installation, première configuration, essai, mise à jour |
| [docs/fr/CONFIGURATION.md](docs/fr/CONFIGURATION.md) | chaque réglage, langue, où le clavardage apparaît, apparence, compatibilité |
| [docs/fr/HOW-IT-WORKS.md](docs/fr/HOW-IT-WORKS.md) | composants, parcours des messages, ce qui est stocké et où, modèle de sécurité |
| [docs/fr/TROUBLESHOOTING.md](docs/fr/TROUBLESHOOTING.md) | symptômes et correctifs, lire l’onglet Réseau du navigateur |
| [docs/fr/law25.md](docs/fr/law25.md) | notes sur la protection des renseignements personnels (Loi 25 du Québec) |
| [docs/fr/DEVELOPMENT.md](docs/fr/DEVELOPMENT.md) | organisation, site d’essai local, tests, conventions, publication |
| [CHANGELOG.fr.md](CHANGELOG.fr.md) | versions |

## Organisation du dépôt

`wp-chat/` est le module (le dossier à installer) · `dev/` un site d’essai Docker · `tests/` des tests Node ·
`docs/`.

## Licence

GPL-2.0-or-later (voir l’en-tête du module).
