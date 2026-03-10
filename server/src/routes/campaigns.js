import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  listCampaigns,
  getCampaignPublic,
  getCampaignById,
  createCampaign,
  updateCampaign,
  closeCampaign,
  deleteCampaign,
  uploadCampaignPhotos,
  deleteCampaignPhoto,
  serveCampaignPhoto,
} from '../controllers/campaignController.js'
import { uploadPhotos } from '../middleware/uploadPhoto.js'

const router = Router()

// Route publique — pas d'auth requise
router.get('/public/:slug', getCampaignPublic)

// Routes protégées back-office (Admin et Média)
router.get('/', requireAuth, listCampaigns)
router.get('/:id', requireAuth, getCampaignById)

// Routes Admin uniquement
router.post('/', requireAuth, requireRole('ADMIN'), createCampaign)
router.put('/:id', requireAuth, requireRole('ADMIN'), updateCampaign)
router.put('/:id/close', requireAuth, requireRole('ADMIN'), closeCampaign)
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteCampaign)

// Photos de brief — upload/suppression admin, accès public en lecture
router.post('/:id/photos', requireAuth, requireRole('ADMIN'), uploadPhotos, uploadCampaignPhotos)
router.delete('/:id/photos/:photoId', requireAuth, requireRole('ADMIN'), deleteCampaignPhoto)
router.get('/:id/photos/:photoId', serveCampaignPhoto)

export default router
