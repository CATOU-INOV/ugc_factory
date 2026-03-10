// Configuration Multer — Upload de vidéos
// Stockage local dans uploads/videos/:campaignId/
// Pour passer à S3/MinIO/Scaleway : remplacer diskStorage par multer-s3

import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_ROOT = path.join(__dirname, '../../uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organise par campagne : uploads/videos/:campaignId/
    const campaignId = req.params.campaignId || req.body.campaignId || 'unknown'
    const dest = path.join(UPLOADS_ROOT, 'videos', campaignId)
    fs.mkdirSync(dest, { recursive: true })
    cb(null, dest)
  },
  filename: (req, file, cb) => {
    // Nom unique : timestamp + extension originale
    const ext = path.extname(file.originalname).toLowerCase()
    const filename = `${randomUUID()}-${Date.now()}${ext}`
    cb(null, filename)
  },
})

// Filtre : formats vidéo acceptés
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
    'video/webm', 'video/x-matroska', 'video/avi',
  ]
  if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
    cb(null, true)
  } else {
    cb(new Error('Format de fichier non accepté. Formats supportés : MP4, MOV, AVI, WebM, MKV'), false)
  }
}

export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
})

export const UPLOADS_ROOT_PATH = UPLOADS_ROOT
