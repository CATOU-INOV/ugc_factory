import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { getAnnualBudget, setAnnualBudget } from '../controllers/settingsController.js'

const router = Router()

router.get('/annual-budget', requireAuth, getAnnualBudget)
router.put('/annual-budget', requireAuth, requireRole('ADMIN'), setAnnualBudget)

export default router
