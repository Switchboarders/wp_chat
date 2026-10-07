[English](../INSTALL.md) · **Français**

# Installer WP Chat

WP Chat est un module WordPress qui ajoute une bulle de clavardage à votre site Web. Il a besoin d’un
serveur **switchboard-chat** en fonctionnement (le « serveur de clavardage »), avec lequel il
communique directement depuis le navigateur du visiteur. Installez d’abord le serveur : voir la
documentation de switchboard-chat (`docs/fr/web-chat.md` et `docs/fr/reverse-proxy.md` dans ce projet).

## Prérequis

| | |
|---|---|
| WordPress | 5.8 ou plus récent (site unique ou multisite; activation par site) |
| PHP | 7.4 ou plus récent (aucune extension, aucun Composer, aucun accès à un terminal) |
| Serveur de clavardage | joignable en **HTTPS** par les visiteurs, avec l’adresse de votre site Web dans son `WEB_ALLOWED_ORIGINS` et une diffusion en continu qui fonctionne (vérifications dans son `web-chat.md`, section 4) |
| Navigateurs | Chrome, Edge, Firefox et Safari récents (exigent `fetch` et `EventSource`); pas Internet Explorer |

Avant de commencer, ayez ces deux valeurs :

- **L’adresse du serveur de clavardage**, p. ex. `https://chat.example.org` (https, sans barre
  oblique finale).
- **L’adresse de votre site Web telle que les visiteurs la voient**, p. ex. `https://www.example.org`.
  Elle doit figurer *exactement* dans le `WEB_ALLOWED_ORIGINS` du serveur (`https://www.example.org` et
  `https://example.org` sont des origines différentes; inscrivez les deux si les deux existent).

## 1. Obtenir le module

Construisez le fichier zip à partir d’une copie de ce dépôt :

```bash
zip -r wp-chat.zip wp-chat -x "*.DS_Store"
```

(Le zip doit contenir un seul dossier de premier niveau nommé `wp-chat`. Ne compressez **pas** tout le
dépôt.)

## 2. Installer et activer

Choisissez l’une des méthodes :

- **Administration WordPress :** Extensions → Ajouter → Téléverser une extension → choisir
  `wp-chat.zip` → Installer → Activer.
- **Copie de fichiers (FTP/SFTP/SSH) :** copiez le dossier `wp-chat` dans `wp-content/plugins/`, puis
  activez-le sous Extensions. Si vous avez copié le dépôt entier, assurez-vous que le chemin est
  `wp-content/plugins/wp-chat/wp-chat.php` (et non `…/wp_chat/wp-chat/wp-chat.php`) : WordPress ne
  trouve les modules qu’à un seul niveau de dossier de profondeur.
- **WP-CLI :** `wp plugin install wp-chat.zip --activate`

La propriété des fichiers doit permettre au serveur Web de les lire (normalement `644` pour les
fichiers, `755` pour les dossiers).

## 3. Configurer

Réglages → **WP Chat**. La première ligne de la page indique en termes clairs si le clavardage est
affiché et, sinon, pourquoi. Au minimum :

1. **URL du serveur (https)** : l’adresse de votre serveur de clavardage. Toute adresse qui ne commence
   pas par `https://` est refusée avec une erreur.
2. **Personne responsable de la protection des renseignements personnels** et **URL de la politique de
   confidentialité** : affichées dans l’avis de consentement (nécessaires pour la Loi 25 du Québec et
   des règles semblables).
3. Appuyez sur **Enregistrer**, puis sur **Tester le serveur de clavardage**. Un message vert « Le serveur
   de clavardage répond et accepte ce site Web » indique que l’adresse, le HTTPS et la liste d’origines
   autorisées sont corrects.

Toutes les options sont décrites dans [CONFIGURATION.md](CONFIGURATION.md). Le clavardage reste
**masqué tant qu’une URL de serveur n’est pas enregistrée**.

Sans l’écran d’administration (installations par script), les réglages tiennent en une seule option :

```bash
wp option update wp_chat_options '{"backend_url":"https://chat.example.org","privacy_officer":"Jane Doe","privacy_url":"https://www.example.org/privacy","display_mode":"all"}' --format=json
```

## 4. L’essayer (5 minutes)

1. Ouvrez votre site dans une **fenêtre de navigation privée** : un bouton de clavardage rond apparaît
   en bas à droite.
2. Cliquez dessus, lisez l’avis, appuyez sur le bouton de départ et envoyez un message.
3. Un répondant ouvre la nouvelle salle dans son client Matrix et répond; la réponse apparaît dans le
   module.
4. Le répondant écrit `!fin` (ou le visiteur appuie sur **Terminer**) : le module indique que le
   clavardage est terminé.
5. Dans les outils de développement du navigateur (onglet Réseau), les requêtes vers le serveur de
   clavardage portent un en-tête `Authorization: Bearer …`. Il n’y a **aucun témoin** ni rien dans le
   stockage du navigateur (onglet Application), et WordPress ne détient rien sur le visiteur.

## 5. Texte de confidentialité

Le module ajoute un paragraphe suggéré sous Réglages → Confidentialité → Guide de la politique
(« WP Chat »). Copiez-le dans votre politique de confidentialité et ajoutez qui répond, la durée de
conservation et la personne-ressource. Si vous offrez aussi les SMS, précisez que les textos transitent
par le fournisseur de SMS et les fournisseurs de services mobiles.

## 6. Mise à jour et retrait

- **Mise à jour :** Extensions → Ajouter → Téléverser une extension → choisir le nouveau zip →
  « Remplacer l’actuelle par celle téléversée ». Les réglages sont conservés.
- **Retrait :** désactivez, puis supprimez. Les seules données stockées (`wp_chat_options`) sont
  supprimées avec le module. Les conversations des visiteurs n’ont jamais touché WordPress : il n’y a
  rien d’autre à nettoyer.

## 7. Si quelque chose ne fonctionne pas

Voir [TROUBLESHOOTING.md](TROUBLESHOOTING.md). Les causes les plus courantes : une URL de serveur vide ou
non https, l’origine du site Web absente du `WEB_ALLOWED_ORIGINS` du serveur, et un proxy inverse qui
met en mémoire tampon le flux en direct, de sorte que les réponses n’apparaissent jamais.
