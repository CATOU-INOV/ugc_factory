# État des lieux — UGC Factory Orchestra
**Document de cadrage — Présentation CODIR**
*Avril 2026*

---

## 1. Contexte et objectif

Orchestra souhaite lancer des **jeux concours UGC** (User Generated Content) : des campagnes où des clients filment et soumettent des vidéos mettant en scène des produits de la marque. Les vidéos sélectionnées sont ensuite exploitées dans des campagnes publicitaires, avec l'accord écrit des participants.

Un **POC (Proof of Concept)** a été développé pour valider la faisabilité avant tout investissement. Il s'agit d'une version fonctionnelle complète, conçue pour démontrer le parcours de bout en bout et recueillir des retours avant la mise en production.

Le cadre juridique encadrant la collecte de données et l'utilisation des contenus à des fins publicitaires est validé.

---

## 2. Les trois espaces de l'application

### Espace 1 — Back-office Administrateur

L'administrateur dispose d'un tableau de bord centralisé avec quatre sections :

**Gestion des campagnes**
Création, modification, clôture et suppression des campagnes. La limite de 3 campagnes actives simultanément est appliquée automatiquement. Chaque campagne affiche en temps réel le nombre de candidatures reçues et sa date limite.

**Suivi budgétaire**
Un bloc dédié présente trois indicateurs distincts :
- *Budget annuel* — le plafond défini par l'équipe
- *Engagé* — le budget prévisionnel si toutes les dotations prévues sont envoyées
- *Dépensé* — les rétributions effectivement versées aux participants sélectionnés

Ce suivi permet d'anticiper les dépassements avant qu'ils ne surviennent.

**Gestion des contrats**
Accès à tous les contrats de cession de droits, filtrables par campagne ou par nom de participant. Téléchargement des PDF signés.

**Logs emails**
Traçabilité de tous les événements de communication (confirmation de participation, envoi de contrat, notification de rétribution). En production, ces événements déclencheront des envois réels.

---

### Espace 2 — Médiathèque

Espace dédié aux équipes créatives et publicitaires. Vue simplifiée et épurée : uniquement les campagnes et les vidéos qui les concernent. Les utilisateurs médiathèque ne voient pas les données personnelles des participants, ni les outils de gestion.

Ils peuvent consulter et télécharger les vidéos des participations **terminées** uniquement — c'est-à-dire validées, contrat signé, rétribution confirmée. C'est une protection intentionnelle : aucun contenu n'est accessible avant que le processus contractuel soit complet.

---

### Espace 3 — Page publique participant

La page qu'un participant voit lorsqu'il reçoit le lien d'une campagne. Elle présente :
- Le **brief de la campagne** : ce qu'il faut montrer, les consignes, les restrictions (logos concurrents, lieux identifiables, etc.)
- Les **exemples de phrases** suggérées
- Les **conditions de participation** (ici : enfants autorisés dans la vidéo)
- La **rétribution** proposée (bon d'achat 50€) avec mention claire que la sélection n'est pas garantie
- Un **compteur de temps restant** visible

Le bouton "Je participe" ouvre le formulaire de dépôt : informations personnelles + upload de la vidéo. La vidéo est validée automatiquement côté navigateur avant l'envoi (durée, résolution, présence d'une piste audio).

---

## 3. Ce qui est fonctionnel aujourd'hui

| Fonctionnalité | État |
|----------------|------|
| Création et gestion des campagnes | ✅ Fonctionnel |
| Page publique participant | ✅ Fonctionnel |
| Upload et validation de vidéo | ✅ Fonctionnel |
| Workflow de modération complet | ✅ Fonctionnel |
| Génération automatique de contrat PDF | ✅ Fonctionnel (module interne POC — remplacé par Tomorro en production) |
| Signature en ligne du contrat | ✅ Fonctionnel (module interne POC — remplacé par Tomorro en production) |
| Suivi budgétaire (engagé / dépensé) | ✅ Fonctionnel |
| Accès médiathèque sécurisé | ✅ Fonctionnel |
| Gestion des utilisateurs (admin / médiathèque) | ✅ Fonctionnel |
| Envoi d'emails aux participants | ⚠️ Simulé — à brancher |
| Stockage vidéos en cloud | ⚠️ Local — à migrer |
| Base de données production | ⚠️ SQLite — à migrer |

---

## 4. Ce qui tient la charge en production

Ces éléments sont en place et n'ont pas besoin d'être refaits :

**Authentification et contrôle d'accès**
Système de tokens sécurisés avec rôles distincts. Un utilisateur médiathèque ne peut pas accéder aux fonctions admin, et ne peut télécharger que les vidéos dont le contrat est signé. Ces règles sont appliquées côté serveur, pas seulement dans l'interface.

**Architecture découplée**
Le code qui gère la base de données, le stockage des fichiers, et les emails est isolé dans des modules indépendants. Passer de SQLite à PostgreSQL ou de disque local à S3 ne nécessite pas de réécrire l'application — uniquement de remplacer ces modules.

**Protection contre les abus**
Limitation du nombre de tentatives de connexion (10 essais / 15 minutes) et du nombre de soumissions par IP (5 / heure). Noms de fichiers non-prédictibles pour éviter l'accès direct aux vidéos.

**Workflow de statuts verrouillé**
Les transitions entre statuts sont strictement contrôlées côté serveur. Il est impossible de passer une candidature de "reçue" à "terminée" sans passer par toutes les étapes intermédiaires. Cela garantit qu'aucun contenu n't est utilisé sans contrat signé.

**Performance à l'échelle**
Les optimisations réalisées ce jour (indexes de base de données, limitation des résultats renvoyés) permettent à l'application de tenir avec des milliers de participations sans dégradation.

---

## 5. Ce qui doit changer avant la mise en production

### Bloquant — sans ça, on ne peut pas lancer

| Chantier | Pourquoi | Responsable | Suggestion |
|----------|----------|-------------|------------|
| **Base de données** (SQLite → PostgreSQL) | SQLite ne supporte pas les écritures simultanées. Un pic de participations provoquerait des erreurs. | IT | Azure Database for PostgreSQL — à évaluer selon contrats existants |
| **Stockage fichiers** (disque local → cloud) | Les fichiers stockés sur le serveur sont perdus si le serveur change. Aucune redondance, aucune sauvegarde. | IT | Azure Blob Storage — à évaluer selon contrats existants |
| **Hébergement serveur applicatif** | L'application doit tourner sur une infrastructure accessible publiquement. | IT | À définir selon politique d'hébergement Orchestra |
| **Emails transactionnels** | Les participants ne reçoivent actuellement aucun email : ni confirmation, ni lien de contrat, ni notification de rétribution. | IT | Service à définir selon outils Orchestra existants |
| **Intégration Tomorro** (signature électronique) | Le module PDF interne du POC doit être remplacé par l'API V2 REST Tomorro pour garantir la validité juridique des cessions de droits. Tomorro est déjà utilisé par le juridique Orchestra. | Thomas (clé API à récupérer auprès du juridique) | API V2 REST Tomorro |

### Important — à faire avant le premier lancement

| Chantier | Pourquoi | Effort |
|----------|----------|--------|
| **Hébergement + domaine** | Déployer sur un serveur accessible, avec un sous-domaine Orchestra (ex: ugc.orchestra.fr) et un certificat SSL | 1 jour |
| **Environnement de recette** | Tester le parcours complet sur une instance miroir avant la mise en ligne réelle | 1 jour |
| **Configuration des secrets** | La clé de chiffrement des sessions doit être générée proprement en production | 30 min |

---

## 6. Infrastructure et coûts

### Schéma cible

```
Participants & équipe Orchestra
            ↓
   Cloudflare — protection, SSL, CDN
            ↓
   Serveur applicatif (Node.js)
   ↓              ↓               ↓
PostgreSQL    Stockage S3     Service email
(données)  (vidéos, PDF)    
```

### Estimation mensuelle

| Composant | Rôle | Solution | Coût / mois |
|-----------|------|----------|-------------|
| Serveur applicatif | Fait tourner l'application | VPS Scaleway (2 vCPU / 2 Go RAM) | ~10–15 € |
| Base de données | Données textuelles uniquement : noms, statuts, dates, emails | PostgreSQL managé (Supabase / Neon) | 0–25 € |
| Stockage fichiers | Fichiers lourds : vidéos, PDF de contrats, photos de brief | **À définir avec l'IT** (Azure Blob, AWS S3, Scaleway…) | À chiffrer |
| Emails transactionnels | Envoi des emails aux participants | Brevo (300/jour gratuit) | 0 € pour commencer |
| Protection / CDN | Sécurité, SSL, mise en cache | Cloudflare (plan gratuit) | 0 € |
| **Total estimé** | | | **10–40 € / mois + stockage à chiffrer** |

> **Stockage — point à clarifier avec l'IT** : l'application est compatible avec tous les services de stockage objet du marché (Azure Blob Storage, AWS S3, Scaleway…). Si Orchestra dispose déjà de contrats Azure, ce poste pourrait être absorbé sans coût supplémentaire. À confirmer. En ordre de grandeur : une vidéo pèse 100–500 Mo, 100 participations représentent 10–50 Go.

### Ce que Cloudflare apporte concrètement
Cloudflare se place en amont du serveur et offre sans coût supplémentaire : protection contre les attaques DDoS, certificat SSL automatique, mise en cache des assets statiques (images, scripts), et un pare-feu applicatif de base. C'est une couche de protection standard pour toute application web exposée publiquement.

---

## 7. Sécurité et scalabilité

### Sécurité — ce qui est en place

**Accès et identités**
L'application distingue trois niveaux d'accès : administrateur, médiathèque, et participant public. Chaque niveau est cloisonné côté serveur — un utilisateur médiathèque ne peut pas accéder aux données admin même en manipulant l'URL. L'authentification repose sur des tokens chiffrés avec une durée de vie de 8 heures. Passé ce délai, le token expire et l'utilisateur doit se reconnecter. Cette durée courte est intentionnelle : si un token était dérobé (accès physique à un poste par exemple), la fenêtre d'exposition est limitée à 8 heures maximum.

**Protection des données personnelles**
Les données collectées (nom, email, téléphone, adresse) sont stockées en base et ne sont accessibles qu'aux administrateurs. Les utilisateurs médiathèque n'y ont pas accès. Les fichiers vidéo sont nommés de façon non-prédictible — il est impossible de deviner l'URL d'une vidéo sans y être autorisé.

**Protection contre les abus**
Deux protections actives sur les points d'entrée publics : limitation des tentatives de connexion (10 essais par quart d'heure) et limitation des dépôts de vidéo (5 par heure par adresse IP). Cela protège contre les soumissions automatisées en masse.

**Injection et manipulation de données**
L'ensemble des échanges avec la base de données passe par un ORM (Prisma) qui paramètre automatiquement toutes les requêtes. Les injections SQL — attaque la plus courante sur ce type d'application — ne sont pas possibles.

**En-têtes de sécurité HTTP**
Les protections standard du navigateur sont activées : interdiction d'afficher l'application dans une iframe, protection contre la détection automatique de type de fichier, et activation du HTTPS forcé en production.

---

### Sécurité — ce qui reste à adresser avant la production

**Validation des fichiers uploadés** *(IT)*
Actuellement le serveur fait confiance au type de fichier déclaré par le navigateur. En production, ce point est délégué à l'IT : activer le scan de fichiers au niveau du bucket cloud (ex : Microsoft Defender for Storage sur Azure). Plus robuste qu'une validation dans le code — couvre les malwares, virus et fichiers corrompus.

**Bibliothèque d'upload (Multer)** *(✅ Réalisé)*
Multer mis à jour de la v1.x (vulnérabilités connues) vers la v2.1.1 lors de cette session. Testé et fonctionnel.

**Image des mineurs** *(Juridique)*
Le POC permet d'activer l'option "enfants autorisés" par campagne. En France, l'utilisation de l'image d'un mineur à des fins publicitaires nécessite le consentement écrit des deux parents. Le contrat Tomorro devra le couvrir explicitement. À soumettre au juridique avant le premier lancement avec cette option activée.

**Conformité RGPD — droit à l'oubli** *(Thomas + Juridique)*
Il n'existe pas de processus de suppression des données d'un participant sur demande. C'est une obligation légale (RGPD). À implémenter : suppression des données personnelles, vidéo et contrat associés sur demande. À cadrer avec le juridique pour définir les règles.

**Rétention des données personnelles** *(Juridique)*
Les données collectées sont conservées indéfiniment. Une politique de rétention doit être définie par le juridique (durée après fin de campagne). La mise en œuvre technique suit.

**Suppression des vidéos refusées** *(IT)*
Les vidéos des candidatures rejetées restent stockées indéfiniment dans le blob cloud. L'IT mettra en place une politique de suppression automatique après X jours — délai à définir avec le juridique.

**Données personnelles en clair en base** *(Juridique → IT si nécessaire)*
Nom, email, téléphone et adresse sont stockés sans chiffrement. À évaluer avec le juridique selon le niveau de sensibilité retenu. Si le chiffrement est jugé nécessaire, la mise en œuvre est confiée à l'IT.

---

### Scalabilité — ce qui tient

**Stateless par conception**
L'authentification ne repose pas sur des sessions stockées côté serveur. Cela signifie que l'on peut déployer plusieurs instances de l'application en parallèle sans configuration supplémentaire — utile si le trafic augmente fortement lors d'un lancement.

**Séparation des responsabilités**
L'application, la base de données et le stockage des fichiers sont trois composants indépendants. Chacun peut être dimensionné séparément selon les besoins, sans toucher aux autres.

**Optimisations réalisées**
Les requêtes fréquentes (filtrage par campagne, par statut, par date) sont indexées en base de données. Les listes de résultats sont plafonnées pour éviter qu'un volume important de participations ne surcharge l'API ou le navigateur.

---

### Scalabilité — les limites actuelles

**SQLite (bloquant — déjà identifié)**
La base de données locale ne supporte pas les écritures simultanées. Résolu par la migration PostgreSQL prévue.

**Stockage local (bloquant — déjà identifié)**
Les vidéos sur disque local ne permettent pas de déployer plusieurs instances. Résolu par la migration vers un stockage cloud.

**Absence de monitoring**
Il n'existe pas aujourd'hui d'outil pour surveiller l'état de l'application en temps réel (charge serveur, erreurs, lenteurs). En production, un outil de supervision simple (Sentry pour les erreurs, ou l'outil de monitoring de l'hébergeur) permettrait de détecter un problème avant qu'il soit signalé par un utilisateur.

---

## 8. Estimation du travail restant

| Chantier | Statut |
|----------|--------|
| Migration PostgreSQL | À faire |
| Migration stockage (à définir avec l'IT) | À faire |
| Branchement emails | À faire |
| Mise en place hébergement + domaine | À faire |
| Environnement de recette | À faire |
| Configuration secrets production | À faire |
| Pagination et indexes base de données | ✅ Réalisé |

---

## 8. Dépôt de code et collaboration

Le code source est hébergé sur GitHub : [lucasn81/poc-ugcfactory](https://github.com/lucasn81/poc-ugcfactory)

**Ce qui est en place**
- Le fichier `.gitignore` exclut correctement les fichiers sensibles : variables d'environnement (`.env`), dépendances (`node_modules`), et base de données locale (`dev.db`). Aucune donnée sensible n'est commitée.

**Ce qui reste à organiser avant de travailler à plusieurs**

| Action | Pourquoi |
|--------|----------|
| Protéger la branche `main` | Empêcher toute modification directe sans validation — tout passe par une revue |
| Créer une branche `develop` | Isoler le travail en cours de la version stable |
| Gérer les accès | Donner les droits au freelance en tant que collaborateur, pas en propriétaire |

Ces trois points prennent moins d'une heure à configurer sur GitHub et permettent de travailler sur le même code sans risque d'écrasement.

---

## 9. Recette et QA avant lancement

Avant toute mise en ligne, un environnement de recette (staging) doit être déployé sur un sous-domaine dédié — par exemple `staging-ugc.orchestra-premaman.com`. C'est sur cet environnement que tous les tests sont effectués, jamais directement en production.

**Parcours à valider**

| Parcours | Ce qu'on teste |
|----------|----------------|
| Dépôt d'une participation | Formulaire complet, upload vidéo, confirmation |
| Modération admin | Visualisation vidéo, changement de statut, génération contrat |
| Signature du contrat | Lien reçu par email, signature, PDF généré |
| Téléchargement médiathèque | Accès vidéo uniquement sur participations terminées |
| Cas limites | Vidéo trop lourde, format non supporté, connexion lente |

**Compatibilité**
L'interface publique (page participant) doit être testée sur mobile — c'est le terminal le plus probable pour un participant qui filme avec son téléphone. Le back-office admin peut rester desktop-first.

---

## 10. Maintenance post-lancement

**Question ouverte : qui intervient si un problème survient ?**

L'application ne nécessite pas de surveillance permanente une fois stable. Mais il faut identifier une personne capable d'intervenir en cas de bug ou de mise à jour. Trois options :

| Option | Avantage | Inconvénient |
|--------|----------|--------------|
| Dev interne Orchestra | Réactivité maximale | Nécessite une montée en compétence sur la stack |
| Contrat de TMA (Tierce Maintenance Applicative) | Cadre formel, SLA défini | Coût fixe mensuel |

La question est à trancher avant le lancement — pas après.

---

## 12. Synthèse

Le POC démontre un parcours complet et fonctionnel : d'une participation publique jusqu'au contenu disponible en médiathèque, en passant par la modération, le contrat signé et la rétribution tracée. L'interface est à l'image d'Orchestra, les rôles sont bien séparés, et le workflow contractuel est verrouillé.

Le travail restant pour la mise en production ne consiste pas à réécrire l'application, mais à **brancher des services professionnels** sur une architecture déjà prête à les recevoir. Le code a été conçu dans cet objectif.

**Budget infrastructure** : 10 à 40 €/mois + stockage à chiffrer avec l'IT.
**Maintenance courante** : légère une fois en production, l'application ne nécessite pas de présence technique permanente.

---

*Document établi à partir de l'analyse du code source et des interfaces du POC — Avril 2026*
