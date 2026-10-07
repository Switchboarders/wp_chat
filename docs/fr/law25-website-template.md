[English](../law25-website-template.md) · **Français**

# Trousse Loi 25 pour un site Web qui utilise WP Chat — modèle à adapter

Un ensemble de textes et de formulaires prêts à adapter, pour un organisme qui offre le module de
clavardage WP Chat sur son site Web et qui doit respecter la Loi 25 du Québec (*Loi sur la protection des
renseignements personnels dans le secteur privé*, telle que modifiée). Tout ce qui est propre à **votre**
organisme est entre `[CROCHETS EN MAJUSCULES]` : remplacez-le, supprimez ce qui ne s’applique pas et
gardez ce qui est vrai.

> **Ceci est un modèle, pas un avis juridique.** Les règles qui s’appliquent à vous (loi sur le secteur
> privé, organisme public, organisme sans but lucratif, règles fédérales), ainsi que la formulation
> exacte et les délais, doivent être confirmés par un juriste ou par votre responsable de la protection
> des renseignements personnels avant la publication. Quand un détail juridique est mentionné
> ci-dessous, il est marqué *(à vérifier)*.
>
> Les textes décrivent ce que **WP Chat et switchboard-chat font réellement**. Si vous changez le logiciel
> ou ses réglages, changez les textes (la section 1 énumère ce qui doit rester concordant).
> Le contexte technique se trouve dans [law25.md](law25.md).

## Comment utiliser cette trousse

1. Lisez la section 1 (les faits) et la section 9 (la liste de concordance). Réglez d’abord le logiciel.
2. Remplissez **une seule fois** la fiche de l’organisme (section 2); réutilisez ces valeurs partout.
3. Adaptez et publiez la **partie A** (section de la politique de confidentialité) sur votre site Web.
   Mettez le lien dans le module (Réglages → WP Chat → *URL de la politique de confidentialité*).
4. Adaptez la **partie B** (l’avis affiché dans la fenêtre de clavardage).
5. Gardez les **parties D à G** dans votre dossier de gouvernance de la vie privée : procédure de
   demandes, engagement des bénévoles, registre des incidents, évaluation des facteurs relatifs à la vie
   privée.
6. Faites tout réviser, datez-le, et révisez-le au moins une fois l’an ou chaque fois que le service change.

Un site Web québécois doit être disponible en français; cette version française de la trousse contient les
textes destinés aux visiteurs en français. Si votre site est bilingue, publiez les deux versions
([law25-website-template.md](../law25-website-template.md) pour l’anglais).

## 1. Les faits sur WP Chat (ne promettez ni plus ni moins)

| Sujet | Ce que fait le logiciel | Réglage qui le contrôle |
|---|---|---|
| Ce que le visiteur doit fournir | Rien : aucun nom, courriel ni numéro de téléphone n’est demandé | – |
| Contenu des messages | Circule du navigateur au serveur de clavardage (en mémoire), puis dans une salle Matrix **chiffrée de bout en bout** lue par les bénévoles. Jamais écrit sur disque ni dans les journaux par le serveur de clavardage. **Le site Web (WordPress) ne le reçoit jamais.** | – |
| Identifiant | Un jeton de session aléatoire gardé seulement dans la mémoire du module : **aucun témoin, aucun stockage du navigateur**. Envoyé dans un en-tête de requête; seule son empreinte est conservée, dans la mémoire du serveur. (Si vous avez activé `WEB_SESSION_COOKIE` pour des modules antérieurs à 0.5.0, décrivez aussi ce témoin.) | délai d’inactivité; page fermée |
| Adresse IP | Gardée dans la **mémoire** du serveur de clavardage une heure au plus (limites contre les abus). Non écrite par le serveur de clavardage. **Votre proxy inverse et votre hébergeur Web peuvent l’enregistrer** (journaux d’accès). | conservation des journaux de votre proxy / hébergeur : **c’est vous qui la fixez** |
| Fin d’une conversation | Le visiteur appuie sur **Terminer**, ou un bénévole écrit `!fin` / `!end`, ou le délai d’inactivité s’écoule. Le serveur de clavardage quitte et oublie la salle et supprime son enregistrement. | `WEB_IDLE_TIMEOUT_MIN` (1440 min = 24 h par défaut) et la *Phrase sur la conservation* du module |
| Qui peut lire une nouvelle conversation | **Chaque répondant actif** du centre d’appels est invité dans la nouvelle salle et peut la lire jusqu’à ce que l’un d’eux écrive `!ok` (salle privée : les autres sont retirés). Dites-le dans la politique. | liste des répondants du centre d’appels (`WEB_CALL_CENTER_ID`) |
| Copies gardées par les bénévoles | Les clients Matrix des bénévoles conservent leur propre copie jusqu’à ce qu’ils suppriment la salle (on le leur demande). | engagement des bénévoles (partie E); politique de conservation facultative du serveur Matrix |
| Redémarrage du serveur de clavardage | Met fin à tous les clavardages ouverts (les sessions sont en mémoire). | – |
| Profilage / pistage | Aucun : pas d’analytique, de publicité ni de script tiers dans le module; aucune technologie pour identifier, localiser ou profiler le visiteur. | – (les **autres** outils d’analyse de votre site sont distincts : décrivez-les dans votre politique générale) |
| Blocage des visiteurs abusifs | Un répondant peut écrire `!bloquer` : le clavardage prend fin et la connexion du visiteur est refusée pendant une durée fixée (1 jour par défaut). Le serveur conserve alors une **empreinte à clé** de l’adresse IPv4 ou du réseau IPv6 /64 et une date de fin (aucun motif, aucun contenu), et la supprime à l’expiration. Dites-le dans la politique. | `WEB_BAN_DAYS`, `WEB_BAN_MAX_DAYS` |
| Marqueur de blocage dans le navigateur | Seulement pour un visiteur qu’un répondant a bloqué : le module enregistre un marqueur signé « bloqué jusqu’à » dans le `localStorage` du navigateur (deux dates et une signature, aucun identifiant) pour que changer de réseau n’aide pas. Rien n’est stocké pour les autres. Dites-le dans la politique. | prend fin avec le blocage |
| Si vous exploitez aussi la ligne SMS | Le numéro de téléphone de l’appelant est stocké chiffré et haché; les conversations sont supprimées après *N* jours de silence; les SMS transitent par voip.ms et les fournisseurs de services mobiles. | `SMS_IDLE_RETENTION_DAYS` (7 par défaut) |
| Journaux de la passerelle | 7 fichiers quotidiens, sans texte de message, sans numéro de téléphone, sans jeton ni mot de passe. | – |
| Où se trouvent les données | là où **vous** hébergez WordPress, le serveur de clavardage, le serveur Matrix et le proxy | vos choix d’hébergement |

## 2. Fiche de l’organisme (à remplir une fois)

| Élément | Votre valeur |
|---|---|
| Dénomination légale de l’organisme | `[NOM DE L’ORGANISME]` |
| Site Web | `[ADRESSE DU SITE WEB]` |
| Personne responsable de la protection des renseignements personnels (nom, titre) | `[NOM ET TITRE DU RESPONSABLE]` |
| Coordonnées pour les demandes en matière de vie privée (courriel, adresse postale, téléphone) | `[COURRIEL]`, `[ADRESSE POSTALE]`, `[TÉLÉPHONE]` |
| Finalité du clavardage (une phrase) | `[FINALITÉ, p. ex. « permettre à une personne de parler anonymement avec un bénévole de son rétablissement d’une dépendance »]` |
| Qui répond | `[QUI RÉPOND, p. ex. « des bénévoles formés de notre fraternité »]` |
| Délai d’inactivité (doit égaler `WEB_IDLE_TIMEOUT_MIN`) | `[24 heures]` |
| Journaux d’accès des serveurs conservés pendant | `[X jours]` |
| Hébergement : WordPress / serveur de clavardage / serveur Matrix (entreprise et pays) | `[ENTREPRISES D’HÉBERGEMENT ET PAYS]` |
| Exploitant du serveur Matrix | `[EXPLOITANT MATRIX]` |
| Conservation Matrix sur les copies des bénévoles (si configurée) | `[X jours / aucune]` |
| Ligne SMS offerte? fournisseur | `[OUI/NON]`, `[FOURNISSEUR SMS, p. ex. voip.ms]`, conservation `[7 jours]` |
| Date de cette version | `[DATE]` |

---

## Partie A — Section « Clavardage » de la politique de confidentialité (à publier sur le site Web)

*Copiez-la dans votre page de politique de confidentialité. Supprimez les variantes entre crochets qui ne
s’appliquent pas, ainsi que le bloc SMS si vous n’offrez pas les SMS.*

> ### Clavardage confidentiel
>
> **Qui nous sommes et pourquoi ce service existe.** `[NOM DE L’ORGANISME]` offre sur ce site Web un
> clavardage confidentiel `[FINALITÉ]`. Les personnes qui répondent sont `[QUI RÉPOND]`.
>
> **Ce que nous recueillons.**
> - Les messages que vous écrivez dans le clavardage et les réponses que vous recevez.
> - Un identifiant aléatoire, gardé seulement dans la mémoire de la page de clavardage ouverte (aucun témoin
>   n’est utilisé), afin que votre conversation puisse se poursuivre pendant que vous clavardez. Il ne
>   contient aucun renseignement sur vous.
> - Votre adresse IP, gardée brièvement dans la mémoire de notre serveur de clavardage pour limiter les
>   abus, et consignée dans les journaux techniques de nos serveurs pendant `[X jours]`. Si un bénévole
>   bloque une connexion pour cause d’abus, nous conservons aussi une empreinte illisible de cette adresse
>   (elle ne permet pas de retrouver l’adresse), et un petit marqueur « bloqué jusqu’à » dans le navigateur bloqué, jusqu’à la fin du blocage, `[1 jour]` par défaut et jamais
>   plus de `[30 jours]`.
>
> Nous ne vous demandons **pas** votre nom, votre adresse courriel ni votre numéro de téléphone, et nous n’en
> avons pas besoin pour clavarder. Le clavardage n’utilise aucun outil d’analyse, de publicité ni de
> profilage, et n’emploie aucune technologie permettant de vous identifier, de vous localiser ou
> d’établir votre profil. *(Si votre site Web utilise d’autres outils, ils sont décrits dans
> `[SECTION DE VOTRE POLITIQUE]`.)*
>
> **Pourquoi nous les recueillons.** Seulement pour mener la conversation que vous demandez, assurer la
> sécurité du service et protéger votre confidentialité. Nous n’utilisons pas vos messages à d’autres
> fins, et nous ne les vendons ni ne les communiquons à des fins de marketing.
>
> **Qui voit quoi.** Les bénévoles de notre équipe qui sont de service peuvent lire ce que vous écrivez :
> une nouvelle conversation est visible des bénévoles de service jusqu’à ce que l’un d’eux la prenne en
> privé; ensuite, seul ce bénévole la voit. Ils ne voient pas votre adresse IP. Les messages transitent par
> notre serveur de clavardage et par une salle de conversation privée et chiffrée de notre serveur de
> messagerie, exploité par `[EXPLOITANT MATRIX]`. **Ce site Web lui-même ne reçoit ni ne stocke vos
> messages.** Nos fournisseurs de services (hébergement : `[ENTREPRISES D’HÉBERGEMENT]`) hébergent les
> serveurs, mais ne lisent pas les conversations. Nos bénévoles sont liés par un engagement de
> confidentialité écrit.
>
> **Combien de temps nous les conservons.** Votre conversation est supprimée quand vous appuyez sur
> **Terminer**, quand le bénévole y met fin, quand vous fermez la page, ou après `[24 heures]` d’inactivité; l’identifiant
> est alors supprimé aussi. Les bénévoles qui ont participé doivent supprimer leur copie de la conversation `[et notre serveur
> de messagerie retire les vieux messages après X jours]`. Les journaux techniques sont conservés
> `[X jours]`. L’empreinte d’une connexion bloquée est supprimée à la fin du blocage.
>
> **Où se trouvent vos renseignements.** Nos serveurs sont situés `[PAYS / PROVINCE]`. `[S’ils sont hors
> Québec : « Vos renseignements peuvent être traités hors du Québec, en PAYS. Nous avons évalué ce transfert
> et exigeons une protection comparable à celle du Québec. » *(à vérifier)*]`
>
> **Comment nous les protégeons.** Les connexions sont chiffrées (HTTPS); les salles de conversation sont
> chiffrées de bout en bout; l’accès est limité à des bénévoles formés; le service limite les abus et ne
> conserve aucun historique de conversation.
>
> **Vos droits.** Vous pouvez demander si nous détenons des renseignements sur vous, demander à les
> consulter ou à les faire corriger, nous demander d’y mettre fin et de les supprimer, et retirer votre
> consentement en tout temps (il suffit d’appuyer sur **Terminer**). Comme nous ne conservons aucun
> registre reliant une conversation à une personne, nous ne pouvons ni retrouver ni récupérer une
> conversation une fois qu’elle est supprimée. Pour exercer un droit, poser une question ou déposer une
> plainte, communiquez avec notre personne responsable de la protection des renseignements personnels :
> `[NOM ET TITRE DU RESPONSABLE]`, `[COURRIEL]`, `[ADRESSE POSTALE]`. Nous répondons dans le délai prévu par
> la loi *(à vérifier : 30 jours)*. Vous pouvez aussi communiquer avec la Commission d’accès à
> l’information du Québec (cai.gouv.qc.ca).
>
> **Sur un appareil partagé ou public.** Appuyez sur **Terminer** et fermez l’onglet quand vous avez fini.
> La conversation n’est pas conservée sur ce site Web, mais elle reste visible sur votre écran tant que
> vous ne l’avez pas fait.
>
> *Identifiant utilisé par le clavardage (aucun témoin) :*
>
> | Identifiant | Rôle | Conservé par | Durée de vie |
> |---|---|---|---|
> | jeton de session | poursuit votre conversation | la page de clavardage ouverte (mémoire seulement) et notre serveur de clavardage (`[ADRESSE DU SERVEUR DE CLAVARDAGE]`, empreinte seulement) | jusqu’à ce que vous mettiez fin au clavardage, fermiez la page ou `[24 heures]` d’inactivité |
>
> **Ligne SMS** *(à supprimer si elle n’est pas offerte).* Si vous envoyez un texto à notre numéro
> `[NUMÉRO SMS]`, nous recevons votre numéro de téléphone et vos messages par l’entremise de
> `[FOURNISSEUR SMS]` et de votre fournisseur de services mobiles, qui conservent leurs propres
> enregistrements selon leurs propres politiques. Nous ne gardons votre numéro que sous forme chiffrée tant
> que la conversation est ouverte, et nous supprimons la conversation après `[7 jours]` sans texto de votre
> part. Envoyez STOP (ARRET) en tout temps pour ne plus recevoir de messages; pour respecter cette demande,
> nous gardons une empreinte illisible de votre numéro, qui ne permet pas de vous identifier.
>
> *Dernière mise à jour : `[DATE]`.*

## Partie B — Avis affiché dans la fenêtre de clavardage

Le module affiche, avant le premier message : la phrase de confidentialité, la phrase sur la conservation,
la personne-ressource en matière de vie privée et le lien vers la politique, puis un bouton (**J’ai compris,
commencer à clavarder**). Appuyer sur le bouton constitue le consentement du visiteur à commencer. Gardez cet
avis **court, clair et conforme** à la partie A.

| Élément | Où le régler | Formulation suggérée (à adapter) |
|---|---|---|
| Phrase de confidentialité | `wp-chat/languages/widget-strings.json` → `consent` | « Ce clavardage est confidentiel. Nous ne conservons pas vos messages sur ce site Web. » *(valeur par défaut; vraie tant que WordPress ne se trouve pas dans le chemin des messages)* |
| Phrase sur la conservation | Réglages → WP Chat → *Phrase sur la conservation* (gardez-la égale à `WEB_IDLE_TIMEOUT_MIN`) | « Votre conversation est supprimée lorsque vous terminez le clavardage ou après `[24 heures]` d’inactivité. » |
| Personne-ressource en matière de vie privée | Réglages → WP Chat → *Personne responsable de la protection des renseignements personnels* | `[NOM DU RESPONSABLE]` |
| Lien vers la politique de confidentialité | Réglages → WP Chat → *URL de la politique de confidentialité* | `[URL DE LA PARTIE A]` |
| Bouton de départ | `widget-strings.json` → `start` | « J’ai compris, commencer à clavarder » |

Conseils d’adaptation : le consentement doit être donné pour des **fins précises**, dans un **langage clair et
simple**, et pouvoir être distingué des autres conditions *(à vérifier)*. Ne le jumelez pas à des acceptations
sans rapport. Si vous modifiez les phrases, modifiez les deux versions linguistiques et gardez-les conformes
aux faits de la section 1. Le nom de répondant affiché est générique (p. ex. « Répondant »), ce qui convient;
assurez-vous seulement que votre politique dit aux visiteurs que la personne qui répond est un bénévole de
l’équipe et que plusieurs bénévoles de service peuvent voir une nouvelle conversation jusqu’à ce que l’un
d’eux la prenne en privé (comme le fait la partie A).

## Partie C — FAQ pour les visiteurs (page ou section facultative)

| Question | Réponse (à adapter) |
|---|---|
| Dois-je donner mon nom? | Non. Nous ne demandons aucun renseignement personnel. |
| Qui peut lire ce que j’écris? | Seulement les `[BÉNÉVOLES]` de service, dans une salle privée et chiffrée (jusqu’à ce que l’un d’eux prenne votre conversation en privé; ensuite, seul ce bénévole). Pas les administrateurs du site Web. |
| Est-ce vraiment anonyme? | Nous ne demandons pas qui vous êtes et ne gardons aucun historique. Votre fournisseur Internet et le réseau que vous utilisez peuvent tout de même voir que vous vous êtes connecté à ce site; utilisez un réseau privé si cela compte pour vous. |
| Est-ce que quelque chose est enregistré sur mon appareil? | Aucun témoin et rien dans le stockage du navigateur : un identifiant temporaire vit seulement dans la page de clavardage ouverte et disparaît quand vous la fermez. Seule exception : si un bénévole vous bloque pour cause d’abus, un petit marqueur « bloqué jusqu’à » (sans renseignement personnel) est conservé dans votre navigateur jusqu’à la fin du blocage. |
| Puis-je récupérer ma conversation? | Non : elle est supprimée quand elle se termine, personne ne peut donc la retrouver plus tard. |
| Comment arrêter? | Appuyez sur **Terminer**. La conversation est supprimée et le bénévole en est informé. |
| J’ai écrit quelque chose que je regrette. | Mettez fin au clavardage : il est supprimé. Vous pouvez aussi demander au bénévole d’y mettre fin. |
| Comment joindre la personne responsable de la vie privée? | `[COURRIEL]` |

## Partie D — Procédure pour les demandes en matière de vie privée (interne)

| Demande | Que faire | Délai |
|---|---|---|
| **Accès** aux renseignements | Dire honnêtement ce qui existe : normalement rien une fois le clavardage terminé. Pendant un clavardage en cours, le bénévole peut confirmer le contenu de la salle. Pour les SMS, la salle existe jusqu’à sa suppression. Consigner la demande et répondre par écrit. | `[30 jours]` *(à vérifier)* |
| **Rectification** | Il n’y a aucun profil à corriger. Expliquer cela dans la réponse. | idem |
| **Effacement / cessation** | Clavardage Web en cours : un bénévole écrit `!oubli` (ou `!fin`). SMS : écrire `!oubli` dans la salle, ou un administrateur appelle la commande d’API `erase_caller` avec le numéro de l’appelant. Le robot quitte et oublie la salle et supprime les enregistrements. **Demandez à chaque bénévole qui a participé de supprimer la salle sur son appareil.** L’empreinte de désabonnement SMS demeure pour que la personne ne soit plus contactée. | répondre dès que c’est fait; dans `[30 jours]` |
| **Retrait du consentement** | Le visiteur met fin au clavardage; même chose que l’effacement. | immédiat |
| **Plainte** | La consigner, répondre par écrit et informer la personne qu’elle peut communiquer avec la Commission d’accès à l’information. | `[30 jours]` |

Tenez un court journal de chaque demande (date, type, réponse, date de la réponse), sans le contenu d’aucune
conversation. Vérifiez l’identité du demandeur dans la mesure du raisonnable; pour un clavardage anonyme,
cela signifie généralement que seule la personne qui clavarde *en ce moment* peut être confirmée.

## Partie E — Engagement de confidentialité des bénévoles (modèle)

> **Engagement de confidentialité — service de clavardage de `[NOM DE L’ORGANISME]`**
>
> Moi, `[NOM]`, bénévole de `[NOM DE L’ORGANISME]`, je m’engage à ce qui suit lorsque je réponds au service de clavardage ou de SMS :
>
> 1. Je garde **confidentiel** tout ce que j’apprends par l’entremise du service. Je ne discute jamais d’une
>    conversation avec qui que ce soit, sauf, au besoin, avec la personne responsable de la vie privée.
> 2. Je ne **copie**, ne capture, n’enregistre, ne transfère ni n’exporte **aucune** conversation, et je ne
>    cherche pas à savoir qui est la personne.
> 3. Quand une conversation se termine (ou que la personne demande à être oubliée), je **supprime la salle**
>    dans mon propre client Matrix, et je ne garde jamais de notes qui pourraient identifier quelqu’un.
> 4. Je protège mon appareil : verrouillage d’écran, logiciels à jour, aucun partage de mon compte, je me
>    déconnecte des appareils qui ne m’appartiennent pas. J’utilise uniquement le compte Matrix qui m’a été
>    attribué pour ce service.
> 5. Je réponds seulement en tant que `[RÔLE]`, je ne donne aucun conseil médical ou juridique et je suis les
>    lignes directrices de l’organisme (y compris la procédure d’urgence `[LIEN]`).
> 6. Je signale **immédiatement** à `[RESPONSABLE DE LA VIE PRIVÉE]` toute perte d’appareil, tout message
>    envoyé à la mauvaise personne, tout accès soupçonné par quelqu’un d’autre, ou tout ce qui pourrait être
>    un incident de confidentialité.
> 7. Ces engagements se poursuivent après la fin de mon bénévolat. Un manquement peut mettre fin à ma
>    participation et, là où la loi s’applique, avoir d’autres conséquences.
>
> Nom : ______________  Signature : ______________  Date : ______________

Offrez une brève formation sur les commandes (`!ok`, `!fin`, `!oubli`, `!aide`) et sur la suppression des salles.

## Partie F — Registre des incidents de confidentialité (modèle)

Un incident de confidentialité est un accès, une utilisation ou une communication non autorisés par la loi,
la perte de renseignements personnels, ou toute autre atteinte à leur protection. **Consignez chaque
incident, même mineur, que vous ne signalez pas** *(à vérifier : contenu du registre et durée de conservation
exigés; cinq ans est couramment cité)*.

| N° | Date de constatation | Date de l’incident | Ce qui s’est passé | Renseignements en cause | Personnes concernées (nombre) | Cause | Risque de **préjudice sérieux**? (sensibilité des renseignements, conséquences prévisibles, probabilité d’une utilisation préjudiciable) | Commission avisée (date) | Personnes avisées (date) | Mesures prises pour réduire le risque et éviter la récidive | Clos (date, par qui) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | | | |

**Décision :** si l’incident présente un risque de préjudice sérieux, avisez la Commission d’accès à
l’information **et** les personnes concernées **promptement** *(à vérifier : forme et contenu de l’avis)*.
Comme le contenu d’un clavardage d’un service de rétablissement est très sensible, considérez toute
exposition du contenu d’une conversation comme présentant ce risque, jusqu’à preuve du contraire. Les
premières mesures techniques se trouvent dans [law25.md](law25.md), section 6.

## Partie G — Squelette d’évaluation des facteurs relatifs à la vie privée (EFVP)

Une EFVP est exigée pour tout projet d’acquisition, de développement ou de refonte d’un système
d’information impliquant des renseignements personnels, et avant de communiquer des renseignements hors du
Québec *(à vérifier)*. Pré-remplie avec les faits de WP Chat; complétez les parties entre crochets.

| Section | Contenu |
|---|---|
| 1. Projet | Offrir un clavardage anonyme et confidentiel sur `[SITE WEB]` afin de `[FINALITÉ]`, avec des réponses de `[QUI RÉPOND]`. Composants : module WordPress (widget), serveur de clavardage (switchboard-chat), serveur Matrix, proxy inverse; ligne SMS facultative. |
| 2. Renseignements personnels | (a) contenu des messages, possiblement **sensible** (santé, rétablissement, vie personnelle); (b) un identifiant de session aléatoire; (c) adresse IP (mémoire, journaux du proxy); (d) SMS seulement : numéro de téléphone. Aucun nom, courriel ni compte. |
| 3. Nécessité et proportionnalité | Le contenu des messages est nécessaire pour tenir la conversation. L’identifiant est nécessaire pour la poursuivre. L’adresse IP est nécessaire pour limiter les abus. Rien d’autre n’est recueilli. `[Justifiez et envisagez des solutions de rechange, p. ex. une ligne téléphonique.]` |
| 4. Parties et flux | Visiteur ↔ serveur de clavardage (HTTPS) ↔ salle Matrix chiffrée ↔ bénévoles. WordPress n’est pas dans le chemin. Fournisseurs : `[ENTREPRISES D’HÉBERGEMENT]`, `[EXPLOITANT MATRIX]`, `[FOURNISSEUR SMS]`. |
| 5. Lieux et transferts | `[OÙ SE TROUVE CHAQUE SERVEUR; transferts hors Québec et évaluation de la protection]` |
| 6. Conservation et destruction | Web : à la fin du clavardage ou après `[24 h]`; les bénévoles suppriment leurs copies; journaux du proxy `[X jours]`; liste de blocage `[1 jour, 30 jours au plus]`. SMS : après `[7 jours]` de silence; empreinte de désabonnement conservée; sauvegardes `[COMBIEN DE TEMPS, CHIFFRÉES]`. |
| 7. Mesures de protection | HTTPS; salles chiffrées de bout en bout; texte des messages jamais sur disque ni dans les journaux; liste d’origines autorisées; limites de débit; numéros hachés/chiffrés; secrets dans l’environnement; engagement des bénévoles; procédure d’incident. |
| 8. Risques et mesures d’atténuation | Voir le tableau ci-dessous. |
| 9. Risques résiduels | Les appareils des bénévoles gardent des copies jusqu’à leur suppression; les fournisseurs de services mobiles conservent des enregistrements; l’appareil et le réseau du visiteur; `[AUTRES]`. |
| 10. Décision | `[APPROUVÉ / CONDITIONS]` par `[NOM, TITRE]` le `[DATE]`; révision au plus tard le `[DATE]`. |

| Risque | Probabilité / incidence `[ÉVALUER]` | Mesure d’atténuation en place | Action si insuffisante |
|---|---|---|---|
| Visiteur identifié par les journaux du proxy ou de l’hébergeur | `[ ]` | courte conservation des journaux; aucun contenu de message dans les journaux | `[réduire la conservation / anonymiser les adresses]` |
| Un bénévole conserve ou partage une conversation | `[ ]` | engagement, formation, procédure de suppression | `[vérification, retrait de l’accès]` |
| Interception en transit | `[ ]` | HTTPS; salles chiffrées | – |
| Accès non autorisé aux serveurs | `[ ]` | accès restreint, secrets hors du code, champs chiffrés | `[2FA, surveillance]` |
| Jeton de session volé ou réutilisé | `[ ]` | valeur aléatoire, mémoire seulement, HTTPS, courte durée, le clavardage se termine à la fermeture de la page | `[garder WordPress et les extensions à jour]` |
| Contenu sensible exposé par un incident | `[ ]` | registre + procédure d’avis | `[exercer la procédure chaque année]` |

## 9. Liste de concordance (avant la mise en service et à chaque changement)

| Vérification | Où | ☐ |
|---|---|---|
| La phrase sur la conservation égale `WEB_IDLE_TIMEOUT_MIN` | réglages du module ↔ serveur de clavardage | ☐ |
| Personne-ressource et URL de la politique renseignées | réglages du module | ☐ |
| Politique (partie A) publiée, liée depuis le module, datée, en français (et en anglais si bilingue) | site Web | ☐ |
| La politique indique la vraie durée de conservation des journaux du proxy/hébergeur | réglages de journaux de vos serveurs | ☐ |
| Lieux d’hébergement et transferts hors Québec indiqués et évalués | partie A, partie G | ☐ |
| Bloc SMS présent seulement si les SMS sont offerts, avec `SMS_IDLE_RETENTION_DAYS` | partie A, `.env` | ☐ |
| Bénévoles formés et engagement signé (partie E) | dossier de gouvernance | ☐ |
| Procédure de demandes et registre des incidents en place (parties D, F) | dossier de gouvernance | ☐ |
| EFVP complétée et approuvée (partie G) | dossier de gouvernance | ☐ |
| Sauvegardes chiffrées, secrets (`PHONE_ENC_KEY`, `PHONE_HASH_SECRET`) rangés ailleurs | exploitation | ☐ |
| `WEB_ALLOWED_ORIGINS` ne liste que vos sites | serveur de clavardage | ☐ |
| Date de révision fixée (au moins chaque année, et après tout changement du service) | dossier de gouvernance | ☐ |
