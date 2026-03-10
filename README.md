# Orchestra UGC Factory — POC

Plateforme de gestion de contenus UGC (User Generated Content) pour la marque Orchestra.
Permet aux membres du Club Orchestra de soumettre des vidéos dans le cadre de campagnes marketing, et aux équipes internes de gérer validation, contractualisation et rétribution.

---

## Architecture

```
poc-ugcfactory/
├── server/          # API REST Node.js + Express
│   ├── prisma/      # Schéma DB + seed de données
│   ├── src/
│   │   ├── controllers/   # Logique métier
│   │   ├── middleware/     # Auth JWT + upload multer
│   │   ├── routes/        # Routes Express
│   │   └── services/      # Stockage, emails (simulés), PDF
│   └── uploads/     # Vidéos + contrats PDF (local)
└── client/          # Interface React + Vite + TailwindCSS
    └── src/
        ├── api/     # Appels API Axios
        ├── hooks/   # Auth + validation vidéo
        ├── components/
        └── pages/   # Toutes les pages (admin, média, public)
```

---

## Stack technique et justifications

| Composant | Choix | Justification |
|-----------|-------|---------------|
| **Runtime** | Node.js v24 | Disponible, LTS, écosystème JavaScript cohérent |
| **Base de données** | SQLite via Prisma | Zéro configuration pour le POC local. En production : PostgreSQL (open-source européen, auto-hébergeable sur infra Scaleway, OVH…). La migration Prisma ne requiert que de changer `provider = "postgresql"` dans `schema.prisma`. |
| **ORM** | Prisma 5 | Typage fort, migrations automatiques, aucune dépendance propriétaire |
| **API** | Express.js 4 | Pragmatique, bien documenté, large écosystème |
| **Auth** | JWT + bcryptjs | Stateless, aucune dépendance cloud, auto-hébergeable |
| **Upload** | multer | Middleware Express standard, storage local abstrait |
| **PDF** | pdf-lib | Pure JavaScript, aucun binaire natif, aucune dépendance externe |
| **Frontend** | React 18 + Vite 5 | Build rapide (Vite), écosystème stable |
| **CSS** | TailwindCSS 3 | Utility-first, aucun service externe requis |
| **Router** | React Router 6 | Standard React |
| **Formulaires** | react-hook-form | Performant, léger |

**Alternatives non-européennes évitées :**
- Firebase/Supabase → PostgreSQL auto-hébergé (Scaleway, OVH) en production
- AWS S3 → Scaleway Object Storage (compatible S3) ou MinIO (auto-hébergé)
- Vercel/Netlify → déploiement sur VPS européen ou Clever Cloud
- Algolia → recherche SQL native suffisante pour le POC

---

## Prérequis

- Node.js ≥ 18 (testé sur v24)
- npm ≥ 9

---

## Installation et démarrage

### 1. Installer toutes les dépendances

```bash
cd poc-ugcfactory
npm run install:all
```

### 2. Initialiser la base de données et les données de test

```bash
npm run seed
```

Cela crée la base SQLite, les tables, les utilisateurs, les campagnes et les participations de démonstration (avec des vidéos MP4 minimalistes).

### 3. Démarrer en développement

```bash
npm run dev
```

- **API** : [http://localhost:3001](http://localhost:3001)
- **Front-office** : [http://localhost:5173](http://localhost:5173)

---

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | `admin@orchestra.fr` | `admin123` |
| Médiathèque | `media@orchestra.fr` | `media123` |

---

## Données de test pré-générées

### Campagnes

| Titre | Statut | URL publique |
|-------|--------|--------------|
| Rentrée Scolaire 2024 | En cours (14 jours restants) | `/campagne/rentree-scolaire-2024` |
| Noël Orchestra 2024 | En cours (30 jours restants) | `/campagne/noel-orchestra-2024` |
| Été Familia 2024 | Passée | — |

### Participations (Campagne "Rentrée Scolaire 2024")

| Participant | Statut |
|------------|--------|
| Marie Dupont | En attente |
| Jean Martin | Vidéo vue |
| Sophie Bernard | Validée sans contrat (lien de signature généré) |
| Pierre Moreau | Validée (contrat signé) |
| Isabelle Laurent | Terminée (rétribution envoyée) |

---

## Pages et routes

### Front-office public (mobile-first, sans authentification)

| Route | Description |
|-------|-------------|
| `/campagne/:slug` | Présentation de la campagne + CTA participation |
| `/campagne/:slug/participer` | Formulaire de dépôt vidéo |
| `/campagne/:slug/confirmation` | Page de confirmation après dépôt |
| `/contrat/:token` | Signature de contrat (lien unique simulé) |

### Back-office Admin

| Route | Description |
|-------|-------------|
| `/login` | Authentification |
| `/admin` | Tableau de bord + gestion campagnes |
| `/admin/campagne/:id` | Détail campagne en cours + gestion candidatures |
| `/admin/campagne-passee/:id` | Détail campagne passée (lecture) |
| `/admin/utilisateurs` | Création et liste des utilisateurs |
| `/admin/contrats` | Recherche et téléchargement des contrats |
| `/admin/emails` | Logs des emails simulés |

### Back-office Média (lecture seule)

| Route | Description |
|-------|-------------|
| `/media` | Accueil — liste des campagnes |
| `/media/campagne/:id` | Galerie vidéo (téléchargement seulement pour "Terminée") |
| `/media/campagne-passee/:id` | Galerie vidéo (toutes téléchargeables) |

---

## Workflow des statuts de candidature

```
PENDING → VIDEO_VIEWED → REJECTED (fin)
                       → VALIDATED_NO_CONTRACT → VALIDATED → COMPLETED
```

- **PENDING** : vidéo déposée, non consultée
- **VIDEO_VIEWED** : admin a visionné la vidéo (action admin)
- **REJECTED** : vidéo refusée — log email "refus" créé en base
- **VALIDATED_NO_CONTRACT** : vidéo acceptée — contrat créé (token unique), log email "contrat envoyé" créé en base
- **VALIDATED** : participant a signé le contrat (via `/contrat/:token`), PDF généré
- **COMPLETED** : rétribution envoyée — log email "rétribution" créé en base

Les transitions sont enforced côté serveur (pas de saut d'étapes).

---

## Simulation des emails

Aucun email n'est réellement envoyé. Chaque événement déclenchant un email crée un `EmailLog` en base, consultable dans `/admin/emails`.

Les liens de signature de contrat sont visibles dans les logs (ex : `http://localhost:5173/contrat/<token>`).

---

## Validation vidéo (côté client)

Sans ffprobe (non disponible), la validation est effectuée par le navigateur via les API HTML5 :

- **Résolution** ≥ 1920×1080 : `HTMLVideoElement.videoWidth / videoHeight`
- **Durée** ≥ 15 secondes : `HTMLVideoElement.duration`
- **Piste audio non silencieuse** : Web Audio API (`AudioContext + decodeAudioData`)

> En production, une validation serveur avec ffprobe compléterait cette approche.

---

## Génération de contrats PDF

Utilise `pdf-lib` (pure JavaScript). Le template générique de cession de droits est pré-rempli avec les données du participant et de la campagne. Le PDF est généré à la signature et stocké dans `server/uploads/contracts/`.

---

## Abstraction du stockage

Le service `server/src/services/storageService.js` abstrait les opérations fichier. Pour passer à Scaleway Object Storage, MinIO ou AWS S3 en production :

1. Installer le SDK correspondant : `@aws-sdk/client-s3` (compatible Scaleway/MinIO)
2. Remplacer les fonctions `saveFile`, `getAbsolutePath`, `deleteFile` dans `storageService.js`
3. Mettre à jour `uploadVideo` dans `middleware/upload.js` pour utiliser `multer-s3`
4. Les contrôleurs restent inchangés

---

## Contraintes respectées

- ✅ Maximum 3 campagnes actives simultanément (vérification côté serveur)
- ✅ Interface exclusivement en français
- ✅ Mobile-first pour les pages publiques (F1–F4)
- ✅ Responsive pour le back-office
- ✅ Charte Orchestra : rouge `#e40e20`, polices Alphakind/General Sans (fallbacks Nunito/Inter avec commentaires d'intégration)
- ✅ Accessibilité WCAG AA : contrastes vérifiés, focus visible, sémantique HTML

---

## Commandes disponibles

```bash
# Depuis la racine du projet
npm run dev          # Lance server + client en parallèle
npm run seed         # Réinitialise la base et injecte les données de test
npm run build        # Build de production du client
npm run install:all  # Installe toutes les dépendances (racine + server + client)

# Depuis server/
npm run dev          # Serveur seul (avec hot-reload Node --watch)
npm run db:studio    # Ouvre Prisma Studio (visualisation DB)
npm run db:push      # Applique les changements du schéma à la DB
```
