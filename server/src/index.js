// ─────────────────────────────────────────────────────────────────
// POC UGC Factory Orchestra — Serveur Express
// Port : 3001
// ─────────────────────────────────────────────────────────────────

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import campaignRoutes from './routes/campaigns.js'
import submissionRoutes from './routes/submissions.js'
import contractRoutes from './routes/contracts.js'
import userRoutes from './routes/users.js'
import emailLogRoutes from './routes/emailLogs.js'
import settingsRoutes from './routes/settings.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001

const app = express()

// ─── Middleware globaux ──────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173']

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ─── Fichiers statiques (vidéos en streaming) ───────────────────
// Les vidéos sont servies via les routes protégées /api/submissions/:id/video
// Les contrats PDF sont servis via /api/contracts/:id/pdf
// Pas d'accès direct aux uploads (sécurité)

// ─── Routes API ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/contracts', contractRoutes)
app.use('/api/users', userRoutes)
app.use('/api/email-logs', emailLogRoutes)
app.use('/api/settings', settingsRoutes)

// ─── Health check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Gestion des erreurs 404 ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route non trouvée : ${req.method} ${req.path}` })
})

// ─── Gestion des erreurs globales ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fichier trop volumineux' })
  }
  const isProd = process.env.NODE_ENV === 'production'
  res.status(500).json({ error: isProd ? 'Erreur interne du serveur' : (err.message || 'Erreur interne du serveur') })
})

app.listen(PORT, () => {
  console.log(`✅ Serveur UGC Factory démarré sur http://localhost:${PORT}`)
  console.log(`   Environnement : ${process.env.NODE_ENV || 'development'}`)
})
