[English](../TROUBLESHOOTING.md) · **Français**

# Dépannage de WP Chat

Commencez par **Réglages → WP Chat**. La ligne colorée en haut indique si le clavardage est affiché et,
sinon, pourquoi; **Tester le serveur de clavardage** indique si le serveur répond et accepte votre site
Web. Parcourez ensuite le tableau et servez-vous des outils de développement du navigateur (F12) pour les
détails ci-dessous.

## Tableau rapide

| Symptôme | Cause probable → que faire |
|---|---|
| **Aucun bouton sur aucune page** | Le module n’est pas activé, ou l’URL du serveur est vide (ligne rouge sur la page de réglages). Notez qu’une URL qui ne commence pas par `https://` est refusée avec une erreur et n’est pas enregistrée. |
| **Aucun bouton sur certaines pages** | « Seulement les pages sélectionnées » est actif et la page n’est pas cochée; ou la page est un article de blogue ou la page d’accueil (cochez « Afficher aussi sur les articles de blogue… »). Les pages de recherche, d’archives et d’erreur 404 ne sont jamais incluses dans ce mode. |
| **Le bouton s’affiche, mais « Problème de connexion » au départ** | Le serveur de clavardage est injoignable, l’adresse est erronée, ou l’origine de votre site ne figure pas dans le `WEB_ALLOWED_ORIGINS` du serveur (correspondance exacte, p. ex. `https://www.example.org` ≠ `https://example.org`). Voir « Lire l’onglet Réseau du navigateur ». |
| **« Tester le serveur de clavardage » indique qu’il ne peut pas joindre le serveur** | Mêmes causes. Le HTTPS doit être valide (un certificat expiré ou autosigné est refusé par les navigateurs). |
| **Le visiteur peut écrire, mais les réponses n’apparaissent jamais** | Un proxy placé devant le serveur de clavardage met le flux en direct en mémoire tampon. Suivez l’essai de diffusion du `docs/fr/reverse-proxy.md` du serveur. Vérifiez aussi que le répondant a bien répondu dans la bonne salle. |
| **« Aucun répondant disponible » / erreur 503** | Aucun répondant actif dans le `WEB_CALL_CENTER_ID` du serveur, ou le serveur n’est pas configuré. |
| **« Problème de connexion » juste après le premier message** | Le serveur a répondu `401` : il n’accepte pas le jeton de session. Soit le serveur de clavardage est plus ancien que le module 0.5.0 et le navigateur bloque son témoin (mettez le serveur à jour), soit le clavardage est déjà terminé / expiré / le serveur a redémarré. Voir « Lire l’onglet Réseau du navigateur ». |
| **Fonctionne un moment, puis « Problème de connexion »** | Le clavardage a expiré (délai d’inactivité) ou le serveur a redémarré : les clavardages Web vivent en mémoire. Démarrez un nouveau clavardage. |
| **Beaucoup de visiteurs reçoivent « rate limited » (limite de débit atteinte)** | Le serveur voit l’adresse du proxy pour tout le monde : le proxy doit transmettre `X-Forwarded-For` (documentation du serveur). |
| **« Le clavardage n’est pas accessible depuis cette connexion pour le moment »** | Le serveur a refusé ce visiteur avec `403 blocked` : un répondant a utilisé `!bloquer` sur sa connexion (ou une adresse partagée a été bloquée). Le blocage expire de lui-même (1 jour par défaut); un administrateur peut le lever avec la commande d’API `web_unban` du serveur de clavardage. Remplissez *Texte additionnel quand le clavardage est indisponible* pour offrir aux personnes bloquées un autre moyen d’obtenir de l’aide. |
| **Bouton caché derrière une bannière de témoins ou un autre module** | Déplacez-le avec du CSS (voir CONFIGURATION.md, « Apparence »). |
| **Rien ne change après la modification des réglages** | Un cache de pages sert l’ancienne page : videz-le. |
| **Module absent de la liste après une copie de fichiers** | Le dossier est imbriqué trop profondément. Le fichier doit être `wp-content/plugins/wp-chat/wp-chat.php`. |
| **Le module ne se charge pas, la console mentionne la CSP** | Autorisez votre serveur de clavardage dans `connect-src` ainsi que le script en ligne de WordPress (CONFIGURATION.md, « Notes de compatibilité »). |
| **Texte dans la mauvaise langue** | Voir « Langue » dans CONFIGURATION.md : par défaut, c’est le **navigateur** qui décide; vérifiez le réglage Langue du clavardage et la liste des langues du navigateur. |

## Lire l’onglet Réseau du navigateur

Ouvrez le site dans une fenêtre de navigation privée, ouvrez les outils de développement → **Réseau**,
cliquez sur le bouton de clavardage, acceptez l’avis et envoyez un message. Examinez les requêtes vers le
serveur de clavardage :

| Requête | En bonne santé | Sinon |
|---|---|---|
| `session` (POST) | `200`, corps JSON avec un `token` | `403 origin_not_allowed` : l’origine manque dans `WEB_ALLOWED_ORIGINS`. `503` : serveur non configuré ou aucun répondant. `(blocked)` / erreur CORS dans la console : mauvaise adresse, pas de HTTPS, ou origine non autorisée. |
| `message` (POST) | `200` | `401` : aucun jeton valide (le clavardage est terminé, expiré ou le serveur a redémarré), ou serveur trop ancien pour ce module (mettez-le à jour). `429` : limite de débit. |
| `stream` (GET, type `fetch`) | reste **en attente** (ouvert) et affiche les messages entrants | `401` : aucun jeton valide. Se termine aussitôt : un proxy ou un pare-feu le coupe. N’affiche rien quand une réponse est envoyée : mise en mémoire tampon. |

Jeton : les requêtes `message` et `stream` doivent porter un en-tête de requête `authorization: Bearer …`.
S’il manque, la réponse de `session` ne contenait pas de `token` (serveur de clavardage plus ancien que le
module 0.5.0, qui fonctionne alors avec des témoins; certains navigateurs les bloquent).

## Toujours coincé?

Rassemblez : le texte de la ligne d’état de la page de réglages, le résultat du bouton **Tester le
serveur de clavardage**, le code d’état de la requête en échec et le message de la console, et dites si le
problème survient dans une fenêtre privée et dans un autre navigateur. Avec ces éléments, la cause est
presque toujours visible.
