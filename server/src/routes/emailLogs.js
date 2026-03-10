import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { listEmailLogs } from '../controllers/emailLogController.js'

const router = Router()

router.get('/', requireAuth, requireRole('ADMIN'), listEmailLogs)

export default router
