# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all dependencies (run once)
npm run install:all

# Start both server + client in dev mode
npm run dev

# Server only (port 3001, hot-reload via --watch)
npm run dev:server

# Client only (port 5173, Vite HMR)
npm run dev:client

# Seed the database with test data
npm run seed

# Build frontend for production
npm run build

# Prisma schema → SQLite (after schema changes)
cd server && npx prisma db push

# Prisma GUI
cd server && npx prisma studio
```

No test runner is configured — this is a POC.

## Architecture

Monorepo: `server/` (Express API) + `client/` (React SPA), run together via `concurrently`.

### Backend (`server/`)

- **Entry**: `src/index.js` — Express app, global middleware (CORS, security headers, body limits, error handler), mounts all route modules under `/api/*`
- **Pattern**: thin routes → controller functions → `prisma` client. No service layer except for side-effects (emails, PDF, storage).
- **Auth**: `src/middleware/auth.js` — JWT signed with `JWT_SECRET` (8h TTL). `requireAuth` validates the Bearer token OR `?token=` query param (needed for `<video>` src attributes). `requireRole('ADMIN')` restricts admin-only routes.
- **File uploads**: `src/middleware/upload.js` (video via multer, stored in `uploads/videos/:campaignId/`) and `src/middleware/uploadPhoto.js` (campaign photos, `uploads/photos/:campaignId/`). Filenames use `randomUUID() + Date.now()`.
- **Storage abstraction**: `src/services/storageService.js` — `getAbsolutePath(relativePath)` resolves paths and validates they stay within `uploads/` (path traversal protection). Swap to S3/MinIO by replacing this service.
- **Email simulation**: `src/services/emailService.js` — writes `EmailLog` records to the DB instead of sending real emails.
- **PDF generation**: `src/services/pdfService.js` — generates contracts using `pdf-lib` (pure JS, no binaries). Saved to `uploads/contracts/`.
- **Rate limiting**: Login endpoint (10 req/15min), public submission upload (5 req/hour) via `express-rate-limit`.

### Database (`server/prisma/`)

SQLite in dev (`prisma/dev.db`, gitignored). Switch to PostgreSQL by changing `provider` and `DATABASE_URL` in schema.

Key models and relations:
- `Campaign` → `Submission[]`, `CampaignPhoto[]`, `EmailLog[]`
- `Submission` → `Contract?`, `EmailLog[]`
- `AppSetting` — key/value store (currently: `annualBudget`)
- `Campaign.products` is a JSON string (`[{name, reference}]`), parsed manually in controllers
- Roles stored as `String` (SQLite has no enum type): `"ADMIN"` | `"MEDIA"`

**Submission status workflow** (strict transitions enforced in `submissionController.js`):
```
PENDING → VIDEO_VIEWED → REJECTED (terminal)
                       → VALIDATED_NO_CONTRACT → VALIDATED → COMPLETED (terminal)
```
Side-effects triggered by status transitions: `VALIDATED_NO_CONTRACT` creates a `Contract` record + logs contract email; `COMPLETED` logs retribution email.

### Frontend (`client/src/`)

- **Router**: `App.jsx` — `BrowserRouter` + `AuthProvider`. Routes split into `/admin/*` (ADMIN role), `/media/*` (MEDIA role), and public (`/campagne/:slug`, `/contrat/:token`). `ProtectedRoute` component enforces role-based redirects.
- **Auth state**: `hooks/useAuth.jsx` (note: `.jsx` extension — contains JSX). Stores JWT + user object in `localStorage` under keys `ugcfactory_token` / `ugcfactory_user`.
- **API layer**: `src/api/` — one file per resource, all using the shared Axios instance (`api/axios.js`). The Axios instance auto-injects the JWT header and redirects to `/login` on 401. `createSubmission` accepts an optional `config` object for `onUploadProgress` support.
- **Video validation**: `hooks/useVideoValidation.js` — client-side browser validation of video duration, resolution, and audio track before upload.
- **Tailwind**: Custom Orchestra brand colors defined in `tailwind.config.js`: `orchestra-red` (#e40e20), `orchestra-red-dark` (#b50b19), `orchestra-red-light`, `orchestra-red-bg`.

### Environment

Server requires `server/.env` (gitignored). Copy from `server/.env.example`:
```
JWT_SECRET=<96-char hex>
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

Vite proxies `/api/*` to `http://localhost:3001` in dev (configured in `client/vite.config.js`).

### Test accounts (after `npm run seed`)
- `admin@orchestra.fr` / `admin123` → `/admin`
- `media@orchestra.fr` / `media123` → `/media`

### Key constraints
- Max 3 active campaigns simultaneously (enforced in `campaignController.createCampaign`)
- Campaign photos: max 5 per campaign, JPEG/PNG only
- Video uploads: validated client-side (`useVideoValidation`) and stored server-side under the campaign's folder
- Media role users can only download videos for `COMPLETED` submissions
- All UI text is in French
