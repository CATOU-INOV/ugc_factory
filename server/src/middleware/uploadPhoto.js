// Configuration Multer — Upload de photos de brief campagne
// Stockage local dans uploads/photos/:campaignId/
// Pour passer à S3/MinIO/Scaleway : remplacer diskStorage par multer-s3

import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_ROOT = path.join(__dirname, '../../uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const campaignId = req.params.id || 'unknown'
    const dest = path.join(UPLOADS_ROOT, 'photos', campaignId)
    fs.mkdirSync(dest, { recursive: true })
    cb(null, dest)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, filename)
  },
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Format non accepté. Formats supportés : JPEG, PNG, WebP, AVIF'), false)
  }
}

// Max 5 photos à la fois, 10 MB par photo
export const uploadPhotos = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).array('photos', 5)
