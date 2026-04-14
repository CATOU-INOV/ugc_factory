# Handover — UGC Factory Orchestra
**Document de passation technique**
*Session du 14 avril 2026 — Thomas (Data Engineer) assisté de Claude*

---

## 1. Origine du projet

Le POC UGC Factory a été développé par Lucas Nicolas (Brand Content Manager) via Claude Code (vibe coding). Il s'agit d'une application web complète permettant de gérer des jeux concours vidéo UGC à des fins publicitaires.

Le présent document couvre :
- L'état du code tel que reçu
- Les modifications apportées lors de cette session
- L'état actuel du projet
- Ce qu'il reste à faire avant la mise en production

---

## 2. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Runtime | Node.js | v24 |
| Framework API | Express | ^4.21.2 |
| ORM | Prisma | ^5.22.0 |
| Base de données (dev) | SQLite | via Prisma |
| Auth | jsonwebtoken | ^9.0.2 |
| Hash mot de passe | bcryptjs | ^2.4.3 |
| Upload fichiers | Multer | 2.1.1 (mis à jour) |
| Génération PDF | pdf-lib | ^1.17.1 |
| UI | React | ^18.3.1 |
| Bundler | Vite | ^6.0.5 |
| CSS | TailwindCSS | ^3.4.17 |
| HTTP client | Axios | ^1.7.9 |

---

## 3. Architecture

```
client/ (React SPA — port 5173)
    └── src/
        ├── api/          — un fichier par ressource (campaigns, submissions, contracts…)
        ├── hooks/         — useAuth.jsx, useVideoValidation.js
        ├── pages/
        │   ├── admin/    — back-office administrateur
        │   ├── media/    — espace médiathèque
        │   └── public/   — pages participant (formulaire, contrat)
        └── components/

server/ (Express API — port 3001)
    ├── src/
    │   ├── controllers/  — logique métier par ressource
    │   ├── middleware/    — auth.js, upload.js, uploadPhoto.js
    │   ├── routes/        — déclaration des endpoints
    │   ├── services/      — storageService.js, emailService.js, pdfService.js
    │   └── lib/           — prisma.js (client singleton)
    └── prisma/
        ├── schema.prisma  — modèle de données
        └── seed.js        — données de test
```

**Proxy Vite** : en développement, `/api/*` est proxié vers `http://localhost:3001`

---

## 4. Modèle de données

```
User          — comptes back-office (ADMIN | MEDIA)
Campaign      — campagnes UGC (max 3 actives simultanément)
CampaignPhoto — photos de brief (max 5 par campagne)
Submission    — participations des candidats + vidéo
Contract      — contrat de cession de droits (1 par submission)
EmailLog      — traçabilité des communications (simulation en POC)
AppSetting    — paramètres globaux (ex: budget annuel)
```

**Workflow de statuts Submission :**
```
PENDING → VIDEO_VIEWED → REJECTED (terminal)
                       → VALIDATED_NO_CONTRACT → VALIDATED → COMPLETED (terminal)
```

---

## 5. Modifications apportées lors de cette session

### 5.1 Indexes base de données
**Fichier** : `server/prisma/schema.prisma`

Ajout de 5 indexes manquants pour les performances à l'échelle :
- `Submission` : `@@index([campaignId])`, `@@index([status])`
- `Campaign` : `@@index([deadline])`
- `EmailLog` : `@@index([campaignId])`, `@@index([type])`

**Pourquoi** : sans index, chaque filtrage fait un full scan de la table. Critique à partir de quelques milliers de soumissions.

---

### 5.2 Pagination des endpoints de liste
**Fichiers modifiés** :
- `server/src/controllers/submissionController.js` — plafond 500, renvoie `{ submissions, total, limit, offset }`
- `server/src/controllers/contractController.js` — plafond 200, même format
- `server/src/controllers/emailLogController.js` — plafond 200, même format

**Fichiers frontend adaptés** :
- `client/src/api/submissions.js` — commentaire format de réponse
- `client/src/pages/admin/CampaignActivePage.jsx` — extrait `submissions` + bandeau si données tronquées
- `client/src/pages/admin/CampaignPastPage.jsx` — extrait `submissions`
- `client/src/pages/admin/ContractsPage.jsx` — extrait `contracts`, affiche `X/total` si tronqué
- `client/src/pages/admin/EmailLogsPage.jsx` — extrait `logs`, affiche `X/total` si tronqué
- `client/src/pages/media/MediaCampaignActive.jsx` — extrait `submissions`
- `client/src/pages/media/MediaCampaignPast.jsx` — extrait `submissions`

**Pourquoi** : sans pagination, une campagne avec 10 000 participations peut faire planter l'API et le navigateur (réponse de plusieurs Mo chargée en mémoire).

---

### 5.3 Mise à jour Multer
**Fichier** : `server/package.json`

Multer mis à jour de la v1.4.5-lts (vulnérabilités connues) vers la **v2.1.1**.
Testé : les deux middlewares (`upload.js` et `uploadPhoto.js`) chargent sans erreur.

---

### 5.4 Environnement local initialisé
- `server/.env` créé avec un JWT_SECRET généré aléatoirement (96 caractères hex)
- Base de données SQLite créée via `npx prisma db push`
- Données de test chargées via `npm run seed`

**Comptes de test disponibles :**
- Admin : `admin@orchestra.fr` / `admin123`
- Médiathèque : `media@orchestra.fr` / `media123`

**Lancement local :**
```bash
npm run install:all   # une seule fois
npm run seed          # données de test
npm run dev           # démarre client (5173) + serveur (3001)
```

---

## 6. Ce qui reste à faire

### Par Thomas
| Tâche | Détail |
|-------|--------|
| Intégration API Tomorro | Remplacer `pdfService.js` par appels API V2 REST Tomorro — clé API à récupérer auprès du juridique |
| Header CSP | Ajouter `Content-Security-Policy` dans `server/src/index.js` |
| Test intrusion OWASP | À effectuer sur l'environnement staging |
| Droit à l'oubli | Bouton suppression participant en back-office — après cadrage juridique |
| Suppression vidéos refusées | Après définition du délai par le juridique |

### Par l'IT
| Tâche | Détail |
|-------|--------|
| Provisionner PostgreSQL | Suggestion : Azure Database for PostgreSQL |
| Provisionner stockage fichiers | Suggestion : Azure Blob Storage — vérifier contrats existants |
| Provisionner hébergement | Selon politique Orchestra |
| Brancher emails transactionnels | Selon outils Orchestra existants |
| Configurer variables d'env production | Liste ci-dessous |
| Cloudflare (WAF, CDN, DDoS, SSL) | Sur le sous-domaine ugc.orchestra-premaman.com |
| Déployer staging | staging-ugc.orchestra-premaman.com |
| Pipeline CI/CD | GitHub Actions |
| Monitoring / alertes / backups | Outil hébergeur Azure |
| Scan fichiers uploadés | Microsoft Defender for Storage sur le bucket |

### Par le Juridique
| Tâche | Détail |
|-------|--------|
| Fournir clé API Tomorro | Pour intégration par Thomas |
| Clause mineurs dans contrat Tomorro | Consentement parental obligatoire en France |
| Politique de rétention des données | Durée après fin de campagne |
| Évaluer chiffrement données en base | Selon niveau de sensibilité retenu |

---

## 7. Variables d'environnement requises en production

À configurer par l'IT :

```
JWT_SECRET=<96 caractères hex générés aléatoirement>
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://ugc.orchestra-premaman.com
ALLOWED_ORIGINS=https://ugc.orchestra-premaman.com
DATABASE_URL=<URL PostgreSQL fournie par l'IT>

# Stockage cloud (selon choix IT)
# Azure Blob Storage :
AZURE_STORAGE_CONNECTION_STRING=<fourni par IT>
AZURE_STORAGE_CONTAINER=<nom du container>

# Tomorro (signature électronique)
TOMORRO_API_KEY=<fourni par le juridique>
```

> Note : les variables de stockage et Tomorro nécessitent une adaptation du code au moment de l'intégration.

---

## 8. Points de vigilance documentés

| Point | Responsable | Criticité |
|-------|-------------|-----------|
| SQLite → PostgreSQL obligatoire en prod | IT | Bloquant |
| Stockage local → cloud obligatoire en prod | IT | Bloquant |
| Emails transactionnels non envoyés (simulés) | IT | Bloquant |
| Module PDF → Tomorro pour validité juridique | Thomas + Juridique | Bloquant |
| Scan fichiers uploadés au niveau bucket | IT | Élevé |
| Image des mineurs — clause contrat | Juridique | Élevé |
| Droit à l'oubli non implémenté | Thomas + Juridique | Élevé |
| Header CSP manquant | Thomas | Moyen |
| Données personnelles en clair en base | IT + Juridique | À évaluer |

---

## 9. Documents produits lors de cette session

| Fichier | Contenu |
|---------|---------|
| `ETAT_DES_LIEUX.md` | Document de cadrage pour présentation Val — interfaces, architecture, coûts, sécurité |
| `UGC_Factory_Checklist.docx.txt` | Checklist complète mise à jour avec statuts et responsables |
| `UGC_Factory_Roadmap.xlsx - Roadmap.csv` | Roadmap mise à jour avec tâches réalisées et responsables |
| `HANDOVER.md` | Ce document — passation technique complète |

---

*Document produit le 14 avril 2026 — Thomas / Claude*
