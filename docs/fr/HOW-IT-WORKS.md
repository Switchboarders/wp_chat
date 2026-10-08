[English](../HOW-IT-WORKS.md) · **Français**

# Fonctionnement de WP Chat

## Composants

```
 Navigateur du visiteur ──HTTPS──▶ proxy inverse ──▶ switchboard-chat ──▶ Serveur Matrix ◀── répondants
        ▲                                                                                  (Element, …)
        └── charge le module depuis WordPress (JS + CSS + réglages seulement)
```

| Élément | Rôle |
|---|---|
| **Module WP Chat** (ce projet) | Ajoute le module de clavardage à vos pages, stocke ses réglages, fournit l’écran d’administration et le texte de confidentialité suggéré. |
| **Module de clavardage** (`wp-chat/assets/chat.js`, JavaScript simple) | S’exécute dans le navigateur du visiteur : bulle, fenêtre, avis de consentement, messages. Parle **directement** au serveur de clavardage. |
| **Serveur de clavardage** (switchboard-chat) | Reçoit les messages des visiteurs, crée une salle Matrix chiffrée de bout en bout pour les répondants, leur renvoie les réponses. |
| **Répondants** | Répondent depuis n’importe quel client Matrix. |

WordPress ne se trouve **pas** dans le chemin des messages : il ne reçoit, ne relaie et ne stocke jamais un
message.

## Étape par étape

1. Une page se charge. Si le clavardage doit y être affiché (réglages), le module ajoute le CSS/JS du
   module de clavardage et un conteneur vide; le module démarre sous forme de petite bulle.
2. Le visiteur clique sur la bulle : la fenêtre s’ouvre avec l’**avis de consentement** (ce qui est
   conservé, pendant combien de temps, qui contacter). Rien n’est encore envoyé.
3. Le visiteur appuie sur le bouton de départ : le module appelle le serveur de clavardage
   (`POST /web/session`). Le serveur vérifie que l’origine de la page est autorisée, crée une session en
   mémoire et retourne un jeton de session aléatoire, que le module garde dans le navigateur (`sessionStorage`) et envoie dans un en-tête
   `Authorization` (aucun témoin).
4. Le module ouvre une connexion en direct (`GET /web/stream`, évènements envoyés par le serveur) pour
   recevoir les réponses.
5. Le premier message fait créer au serveur la salle Matrix et inviter les répondants actifs. Chaque
   message est un `POST /web/message`.
6. La réponse d’un répondant est poussée par la connexion en direct et affichée dans la fenêtre.
7. Recharger la page ou passer à une autre page du site ne met **pas** fin au clavardage : le module garde le
   code de session dans le navigateur (cet onglet seulement, par défaut), demande au serveur la conversation
   jusqu’ici (`GET /web/history`), l’affiche de nouveau et se reconnecte à la diffusion en direct.
8. Le clavardage prend fin quand le visiteur appuie sur **Terminer** (`POST /web/end`), quand un répondant écrit
   `!fin`, après **48 heures** sans activité (`WEB_IDLE_TIMEOUT_MIN`), ou quand rien n’est écrit pendant 10 minutes
   après l’ouverture. Le serveur retire tous les répondants de la salle Matrix, la quitte et l’oublie : la salle
   disparaît des clients des répondants, et la session est supprimée.

L’API en détail se trouve dans le `docs/fr/web-chat.md` du serveur de clavardage.

## Ce qui est stocké, et où

| Donnée | Où | Conservée |
|---|---|---|
| Réglages du module | Base de données WordPress (`wp_options`, clé `wp_chat_options`) | jusqu’à la suppression du module |
| Texte des messages | mémoire du navigateur (fenêtre ouverte); **mémoire** du serveur de clavardage (les 300 dernières lignes, pour qu’un rechargement puisse les restaurer); salle Matrix (chiffrée) pendant la durée du clavardage | jamais écrit sur disque ni dans les journaux par le serveur; effacé de la mémoire et salle supprimée à la fin du clavardage ou après 48 h sans activité |
| Identifiant du visiteur | jeton de session dans le navigateur (clé `wpchat_session` du `sessionStorage`, ou du `localStorage` si vous choisissez « tout le navigateur »), et son empreinte dans la mémoire du serveur de clavardage; aucun témoin | jusqu’à la fin du clavardage ou 48 h sans activité |
| Adresse IP du visiteur | mémoire du serveur de clavardage, pour les limites de débit | une heure au plus |
| Liste de blocage (seulement après un `!bloquer` d’un répondant) | base de données du serveur de clavardage : empreinte à clé de l’adresse IPv4 ou du réseau IPv6 /64, et une date de fin | jusqu’à l’expiration du blocage (1 jour par défaut); aucun motif, aucun contenu, aucune adresse lisible |
| Marqueur de blocage (seulement après qu’un répondant a bloqué le visiteur) | le navigateur du visiteur bloqué, clé `wpchat_blocked` du `localStorage` : un marqueur signé « bloqué jusqu’à » (deux dates et une signature, aucun identifiant) | jusqu’à la fin du blocage; le visiteur peut le supprimer |
| Tout ce qui concerne le visiteur sur WordPress | **rien** | – |

Le module ne stocke dans le navigateur **que** le code de session ci-dessus (jamais les messages) et, après un blocage, le marqueur de blocage; il n’utilise aucune analytique, aucun script ni police de tiers. La conversation affichée après un rechargement revient de la mémoire du serveur de clavardage, pas du navigateur.

## Modèle de sécurité

- **Liste d’origines autorisées :** le serveur ne répond qu’aux adresses de sites Web inscrites dans
  `WEB_ALLOWED_ORIGINS` (CORS plus une vérification explicite de `Origin` à chaque appel), de sorte
  qu’un autre site ne peut pas utiliser la session d’un visiteur.
- **Jeton de session :** aléatoire, gardé dans le `sessionStorage` (ou le `localStorage`) du navigateur et en mémoire, et envoyé dans un en-tête `Authorization` en HTTPS; le serveur n’en garde que
  l’empreinte. Contrairement à un témoin HTTP seulement, il est lisible par un script exécuté dans la page :
  gardez WordPress et ses extensions à jour.
- **Limites :** la taille et le débit des messages, les nouvelles sessions par IP et les clavardages
  simultanés sont plafonnés par le serveur.
- **Contrôles contre les abus :** les répondants peuvent bloquer un visiteur (`!bloquer`) : le serveur refuse cette
  connexion pendant un moment et le navigateur du visiteur garde un marqueur signé, de sorte qu’un nouveau VPN
  n’aide pas. Quand il y a eu des abus récemment, le module résout d’abord un court calcul (épreuve de calcul)
  avant qu’un clavardage commence; il n’utilise aucun service tiers.
- **Affichage :** le texte du répondant est affiché en texte brut (`textContent`), jamais en HTML.
- **Confidentialité :** la salle Matrix est chiffrée de bout en bout; la liaison navigateur–serveur est en
  HTTPS. L’apparence de « tête-à-tête » est voulue : le visiteur voit un seul nom de répondant générique.

## Navigateurs pris en charge

Tout navigateur récent offrant la diffusion de réponses `fetch` (Chrome, Edge, Firefox, Safari, Samsung
Internet). Comme aucun témoin n’est utilisé, les réglages de témoins tiers et de protection contre le
pistage des navigateurs n’affectent pas le clavardage, et le serveur de clavardage peut se trouver sur
n’importe quel domaine.

## Documents connexes

[INSTALL.md](INSTALL.md) · [CONFIGURATION.md](CONFIGURATION.md) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) ·
[law25.md](law25.md)
