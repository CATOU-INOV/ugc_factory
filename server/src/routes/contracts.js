import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  listContracts,
  getContractByToken,
  signContract,
  downloadContractPDF,
  downloadContractPDFByToken,
} from '../controllers/contractController.js'

const router = Router()

// Routes publiques (accès via token unique)
router.get('/sign/:token', getContractByToken)
router.post('/sign/:token', signContract)
// Téléchargement PDF public via token (après signature)
router.get('/sign/:token/pdf', downloadContractPDFByToken)

// Routes Admin
router.get('/', requireAuth, requireRole('ADMIN'), listContracts)
router.get('/:id/pdf', requireAuth, requireRole('ADMIN'), downloadContractPDF)

export default router
