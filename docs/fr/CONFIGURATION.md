[English](../CONFIGURATION.md) · **Français**

# Référence de configuration de WP Chat

Tout se trouve sous **Réglages → WP Chat**. Les réglages sont stockés dans une seule option WordPress,
`wp_chat_options`. Une ligne d’état en haut de la page indique si le clavardage est affiché et, sinon,
pourquoi; **Tester le serveur de clavardage** vérifie la connexion depuis votre navigateur.

## Réglages

| Réglage | Clé de l’option | Défaut | Signification |
|---|---|---|---|
| URL du serveur (https) | `backend_url` | vide | Adresse du serveur switchboard-chat, p. ex. `https://chat.example.org`. **Doit commencer par `https://`**; toute autre adresse est refusée avec une erreur. **Vide = le clavardage n’est pas affiché.** |
| Nom affiché pour le répondant | `agent_name` | Répondant / Respondent | Un seul nom générique pour tout le monde, afin que le clavardage ressemble à une conversation en tête-à-tête. |
| Couleur d’accent | `color` | `#2b6cb0` | Couleur hexadécimale de la bulle, de l’en-tête, des boutons et des messages du visiteur. |
| URL de la politique de confidentialité | `privacy_url` | vide | Lien affiché dans l’avis de consentement. |
| Personne responsable de la protection des renseignements personnels | `privacy_officer` | vide | Nom affiché dans l’avis de consentement (« Responsable de la vie privée : … »). |
| Phrase sur la conservation | `retention_text` | « Votre conversation est supprimée lorsque vous terminez le clavardage ou après 24 heures d’inactivité. » | Affichée avant que le visiteur commence. **Gardez-la conforme au `WEB_IDLE_TIMEOUT_MIN` du serveur.** |
| Langue du clavardage | `language_mode` | `auto` | Voir « Langue ». |
| Afficher le clavardage sur | `display_mode`, `page_ids`, `include_posts` | toutes les pages | Voir « Où le clavardage apparaît ». |

## Langue

Le module porte ses textes en **français et en anglais** et choisit dans le navigateur du visiteur : les
caches de pages et la langue du site n’ont donc jamais d’importance.

| Mode | Comportement |
|---|---|
| **Langue du navigateur du visiteur** (`auto`, par défaut) | Parcourt dans l’ordre la liste des langues préférées du navigateur et utilise la première entrée française (`fr`, `fr-CA`, `fr-FR`, …) ou anglaise. Si la liste ne contient ni l’une ni l’autre (p. ex. seulement l’espagnol), se rabat sur la langue du site. |
| Langue du site (`site`) | Français si la langue du site WordPress est le français, sinon anglais. |
| Toujours en français / Toujours en anglais (`fr` / `en`) | Imposée à tout le monde. |

Personnaliser les textes : le **nom du répondant** et la **phrase sur la conservation** sont traduits tant
qu’ils gardent leur valeur par défaut. Si vous saisissez votre propre texte, il est affiché tel quel à
chaque visiteur, dans toutes les langues. Les autres textes du module peuvent être modifiés dans
`wp-chat/languages/widget-strings.json`.

Les écrans d’administration (cette page de réglages, le texte de confidentialité suggéré) suivent la
langue de WordPress; le français (Canada, France) est inclus.

## Où le clavardage apparaît

| Choix | Résultat |
|---|---|
| **Toutes les pages** (par défaut) | Sur chaque page du site public (pas dans l’administration). |
| **Seulement les pages sélectionnées** | Seulement sur les pages que vous cochez dans la liste des pages publiées (les sous-pages sont en retrait). Case facultative : **aussi sur les articles de blogue et la page d’accueil des derniers articles**. Masqué partout ailleurs, y compris dans les résultats de recherche, les archives et les pages 404. |

Remarques :

- Une page définie comme « Page des articles » du site est sélectionnable comme n’importe quelle page.
- Si vous choisissez « sélectionnées » sans rien cocher, le clavardage n’est affiché nulle part; la
  ligne d’état vous en avertit.
- Seules les pages publiées sont listées. Les autres types de contenu (produits, types de contenu
  personnalisés) ne sont pas sélectionnables; utilisez « Toutes les pages » et une règle dans le thème si
  vous en avez besoin.

## Apparence

Le module est un élément fixe en bas à droite (`#wp-chat-root`, `z-index: 99999`) mis en forme par
`wp-chat/assets/chat.css`. Pour l’ajuster, ajoutez du CSS dans votre thème (Apparence → Personnaliser →
CSS additionnel) plutôt que de modifier le module, car les mises à jour écraseraient vos changements.
Points d’accroche utiles :

```css
#wp-chat-root { right: auto; left: 16px; bottom: 80px; }   /* le déplacer */
.wpc-window   { width: 380px; height: 520px; }              /* la taille */
#wp-chat-root { --wpc-color: #1a7f5a; }                     /* la couleur (le réglage Couleur d’accent fait cela) */
```

Éléments : `.wpc-bubble`, `.wpc-window`, `.wpc-head`, `.wpc-body`, `.wpc-msg` (`.wpc-mine`,
`.wpc-theirs`), `.wpc-notice`, `.wpc-form`, `.wpc-input`, `.wpc-send`, `.wpc-start`.

## Notes de compatibilité

- **Extensions de cache et d’optimisation :** sans danger. La page est identique pour chaque visiteur (la
  langue est décidée dans le navigateur). Videz le cache après avoir modifié les réglages. Ne « différez »
  pas et ne « combinez » pas le script du module de façon à ce qu’il s’exécute avant que le corps de la
  page existe.
- **Content-Security-Policy :** autorisez votre serveur de clavardage dans `connect-src` (le module
  utilise `fetch` et `EventSource`), p. ex. `connect-src 'self' https://chat.example.org`. Les réglages
  du module sont transmis dans un script en ligne (`WPChatConfig`); `script-src` doit donc autoriser les
  scripts en ligne de WordPress (un nonce ou `'unsafe-inline'`, comme pour le reste de WordPress).
- **Extensions multilingues (WPML, Polylang) :** le module ne les utilise pas; la langue vient du
  navigateur, comme décrit plus haut. Les textes personnalisés ne sont pas traduits.
- **Multisite :** activez et configurez par site.
- **Accessibilité :** la fenêtre est une boîte de dialogue étiquetée, les nouveaux messages sont annoncés
  par une région `aria-live`, et tout fonctionne au clavier.
- **Témoins (cookies) :** c’est le *serveur de clavardage* qui dépose le seul témoin (`wpchat`);
  WordPress n’en dépose aucun pour ce module. Il sert seulement à poursuivre la conversation; plusieurs
  politiques le considèrent comme strictement nécessaire, mais décidez-le avec la personne responsable
  de la protection des renseignements personnels.
