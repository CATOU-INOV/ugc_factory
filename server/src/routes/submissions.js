import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { uploadVideo } from '../middleware/upload.js'
import {
  listSubmissions,
  createSubmission,
  updateSubmissionStatus,
  getSubmissionVideo,
} from '../controllers/submissionController.js'

const router = Router()

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de soumissions depuis cette adresse. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Upload public — pas d'auth (formulaire front-office)
router.post('/campaign/:campaignId', submissionLimiter, uploadVideo.single('video'), createSubmission)

// Listing par campagne — Admin et Média
router.get('/campaign/:campaignId', requireAuth, listSubmissions)

// Vidéo streaming / download — Admin et Média
router.get('/:id/video', requireAuth, getSubmissionVideo)

// Changement de statut — Admin uniquement
router.put('/:id/status', requireAuth, requireRole('ADMIN'), updateSubmissionStatus)

export default router
