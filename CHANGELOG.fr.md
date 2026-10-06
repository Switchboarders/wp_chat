[English](CHANGELOG.md) · **Français**

# Historique des versions

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
