[English](CHANGELOG.md) · **Français**

# Historique des versions

## 0.9.0
- **Relier ce site à un comité avec une seule chaîne, rien à configurer sur le serveur.** Dans SwitchBoard, la
  page *SwitchBoard Chat* du comité affiche une chaîne comme `https://chat.example.org#K7QM-3XRA-PW2D` (valide 30
  minutes, une seule fois). Collez-la dans *Réglages > WP Chat > Relier ce site à un comité* : le module remplit
  l’adresse du serveur, et le serveur de clavardage accepte ce site et envoie ses clavardages à ce comité. Demande
  switchboard-chat avec `POST /web/pair`. Une adresse entrée à la main (avec `WEB_ALLOWED_ORIGINS` sur le serveur)
  fonctionne toujours.
- **Code source ouvert.** Publié sous la licence publique générale GNU, version 2 ou ultérieure (fichier
  LICENSE), par Switchboarders. Ajout de SECURITY.md (signalement privé des vulnérabilités) et de
  CONTRIBUTING.md; en-tête du module avec Plugin URI, auteur et URI de la licence.

## 0.8.1
- Quand personne n’est de garde, le module affiche la macro `no_respondent` du centre d’appels (le même texte que
  reçoivent les appelants SMS), définie dans SwitchBoard. Sans cette macro, il garde sa propre phrase. Le *Texte
  additionnel quand le clavardage est indisponible* de l’administrateur s’affiche toujours dessous. Exige
  switchboard-chat avec cette fonction.

## 0.8.0
- **Le clavardage survit au rechargement et au passage à une autre page du site.** Le module garde le code de
  session anonyme dans le navigateur (`sessionStorage` = cet onglet seulement, par défaut; `localStorage` avec le
  nouveau réglage *Garder le clavardage ouvert d’une page à l’autre* = tout le navigateur) et restaure la
  conversation depuis le serveur de clavardage (`GET /web/history`, gardée dans la mémoire du serveur seulement).
  Les messages ne sont jamais stockés dans le navigateur.
- Fermer la page ou la quitter ne met plus fin au clavardage (la balise de fin de page est retirée). Le clavardage
  prend fin quand le visiteur appuie sur Terminer, quand un répondant écrit `!fin`, ou après **48 heures** sans activité.
- La phrase de conservation par défaut est maintenant de 48 heures (les sites qui avaient gardé l’ancienne valeur par défaut sont mis à jour automatiquement).
- Exige switchboard-chat avec `/web/history`; avec un ancien serveur, un rechargement recommence à zéro.

## 0.7.0
- Le navigateur d’un visiteur bloqué garde un marqueur signé « bloqué jusqu’à » (clé `wpchat_blocked` du
  `localStorage`, seulement après un blocage) et l’envoie quand il demande un nouveau clavardage : changer de VPN
  ou de réseau ne contourne plus un blocage.
- Épreuve de calcul : quand le serveur de clavardage la demande (après des abus, ou quand une même adresse ouvre
  plusieurs clavardages), le module résout un court calcul avant le début du clavardage (« Vérification de votre
  connexion… »). Aucun service tiers.
- Exige switchboard-chat avec les mêmes fonctions; les anciens serveurs continuent de fonctionner sans elles.

## 0.6.0
- Messages clairs pour un visiteur qui ne peut pas être servi : connexion bloquée (`!bloquer` par un répondant),
  personne de disponible, clavardage occupé ou trop de tentatives.
- Nouveau réglage *Texte additionnel quand le clavardage est indisponible* (par exemple un autre numéro à
  appeler), affiché avec ces messages.
- Fonctionne avec la protection contre les abus de switchboard-chat (`!bloquer`, `WEB_SESSIONS_PER_IP_PER_HOUR`,
  `web_unban`).

## 0.5.0
- **Plus de témoin.** Le module garde un jeton de session dans sa propre mémoire et l’envoie dans un en-tête
  `Authorization`; le flux en direct utilise la diffusion `fetch` au lieu d’`EventSource`. Le clavardage
  fonctionne maintenant dans les navigateurs qui bloquent les témoins tiers (Samsung Internet, Safari, Firefox
  en mode strict), quel que soit le domaine du serveur de clavardage.
- Fermer la page met fin au clavardage (avis de fermeture); reconnexion automatique si le flux est coupé; un
  `401` met fin au clavardage.
- Se rabat sur les témoins + `EventSource` avec un serveur de clavardage antérieur au mode par jeton.
- Pour un comportement optimal, exige switchboard-chat avec sessions par jeton (fonctionne aussi avec les anciens serveurs).

## 0.4.0
- Retrait du bouton « Sortie rapide » et de son réglage « URL de la sortie rapide » (une valeur résiduelle
  enregistrée est supprimée automatiquement).

## 0.3.0
- Le module de clavardage suit la langue du navigateur du visiteur (français ou anglais) par défaut. Nouveau
  réglage « Langue du clavardage » : navigateur, langue du site, toujours en français, toujours en anglais.
- Textes du module fournis dans les deux langues (`languages/widget-strings.json`); le nom du répondant et la
  phrase sur la conservation personnalisés sont affichés tels que saisis.
- Ajout de la traduction d’administration `fr_FR`.

## 0.2.1
- Ligne d’état dans la page de réglages expliquant pourquoi le clavardage est masqué (URL vide, aucune page
  sélectionnée).
- Une URL de serveur qui n’est pas en `https://` affiche maintenant une erreur au lieu d’être abandonnée
  silencieusement.
- Bouton « Tester le serveur de clavardage » (joignabilité et CORS depuis le navigateur de l’administrateur).

## 0.2.0
- Choix de l’endroit où le clavardage apparaît : toutes les pages ou des pages sélectionnées, et
  éventuellement les articles de blogue.

## 0.1.0
- Première version : fenêtre de clavardage en tête-à-tête réductible, avis de consentement, bouton pour
  terminer, sortie rapide, traduction en français (Canada), texte de politique de confidentialité suggéré.
