// Service de stockage — Abstraction locale
// Pour passer à S3/MinIO/Scaleway Object Storage :
//   1. Installer le SDK correspondant (ex: @aws-sdk/client-s3 ou minio)
//   2. Remplacer les fonctions ci-dessous par des appels API cloud
//   3. Les contrôleurs restent inchangés

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_ROOT = path.join(__dirname, '../../uploads')

/**
 * Sauvegarde un buffer dans un fichier
 * @param {Buffer} buffer - Données du fichier
 * @param {string} relativePath - Chemin relatif depuis uploads/ (ex: "videos/campId/file.mp4")
 * @returns {string} Chemin absolu du fichier sauvegardé
 */
export function saveFile(buffer, relativePath) {
  const absolutePath = path.join(UPLOADS_ROOT, relativePath)
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
  fs.writeFileSync(absolutePath, buffer)
  return absolutePath
}

/**
 * Retourne le chemin absolu d'un fichier stocké
 * @param {string} relativePath - Chemin relatif depuis uploads/
 * @returns {string} Chemin absolu
 */
export function getAbsolutePath(relativePath) {
  const resolved = path.resolve(UPLOADS_ROOT, relativePath)
  const uploadsRoot = path.resolve(UPLOADS_ROOT)
  if (resolved !== uploadsRoot && !resolved.startsWith(uploadsRoot + path.sep)) {
    throw new Error('Chemin de fichier non autorisé')
  }
  return resolved
}

/**
 * Vérifie si un fichier existe
 * @param {string} relativePath - Chemin relatif depuis uploads/
 * @returns {boolean}
 */
export function fileExists(relativePath) {
  return fs.existsSync(path.join(UPLOADS_ROOT, relativePath))
}

/**
 * Supprime un fichier
 * @param {string} relativePath - Chemin relatif depuis uploads/
 */
export function deleteFile(relativePath) {
  const absolutePath = path.join(UPLOADS_ROOT, relativePath)
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath)
  }
}

/**
 * Retourne le chemin racine des uploads (pour les streams)
 */
export { UPLOADS_ROOT }
