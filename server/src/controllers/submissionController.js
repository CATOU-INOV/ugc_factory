import prisma from '../lib/prisma.js'
import { getAbsolutePath } from '../services/storageService.js'
import { logRejectionEmail, logContractEmail, logRetributionEmail } from '../services/emailService.js'
import { generateContractPDF } from '../services/pdfService.js'
import { randomUUID, randomBytes } from 'crypto'
import fs from 'fs'
import path from 'path'

// ─── Workflow des statuts ─────────────────────────────────────────
// PENDING → VIDEO_VIEWED → REJECTED → VALIDATED_NO_CONTRACT (avant deadline uniquement)
//                        → VALIDATED_NO_CONTRACT → VALIDATED → COMPLETED (terminal)
// Note : le mail de refus n'est envoyé qu'après la fin de la campagne
const STATUS_TRANSITIONS = {
  PENDING: ['VIDEO_VIEWED'],
  VIDEO_VIEWED: ['REJECTED', 'VALIDATED_NO_CONTRACT'],
  REJECTED: ['VALIDATED_NO_CONTRACT'], // réouverture possible avant deadline
  VALIDATED_NO_CONTRACT: ['VALIDATED'],
  VALIDATED: ['COMPLETED'],
  COMPLETED: [],
}

export async function listSubmissions(req, res) {
  const { campaignId } = req.params
  const [campaign, submissions] = await Promise.all([
    prisma.campaign.findUnique({ where: { id: campaignId }, select: { deadline: true } }),
    prisma.submission.findMany({
      where: { campaignId },
      include: { contract: { select: { id: true, token: true, signedAt: true, pdfPath: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Après la deadline : envoyer les mails de refus manquants (fire-and-forget)
  if (campaign && new Date(campaign.deadline) < new Date()) {
    const rejected = submissions.filter(s => s.status === 'REJECTED')
    if (rejected.length > 0) {
      const existingLogs = await prisma.emailLog.findMany({
        where: { campaignId, type: 'REJECTION' },
        select: { submissionId: true },
      })
      const alreadySent = new Set(existingLogs.map(l => l.submissionId))
      const toNotify = rejected.filter(s => !alreadySent.has(s.id))
      if (toNotify.length > 0) {
        Promise.all(toNotify.map(s => logRejectionEmail(s))).catch(() => {})
      }
    }
  }

  res.json(submissions)
}

export async function createSubmission(req, res) {
  const { campaignId, firstName, lastName, email, phone, address } = req.body

  // Validation champs requis
  if (!campaignId || !firstName || !lastName || !email || !phone || !address) {
    if (req.file) fs.unlinkSync(req.file.path)
    return res.status(400).json({ error: 'Tous les champs personnels sont obligatoires' })
  }

  // Validation longueurs
  if (firstName.trim().length > 100 || lastName.trim().length > 100) {
    if (req.file) fs.unlinkSync(req.file.path)
    return res.status(400).json({ error: 'Nom ou prénom trop long (max 100 caractères)' })
  }
  if (address.trim().length > 500) {
    if (req.file) fs.unlinkSync(req.file.path)
    return res.status(400).json({ error: 'Adresse trop longue (max 500 caractères)' })
  }

  // Validation format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    if (req.file) fs.unlinkSync(req.file.path)
    return res.status(400).json({ error: 'Format d\'email invalide' })
  }

  // Validation format téléphone (accepte formats FR et internationaux)
  const phoneRegex = /^[+\d\s\-().]{7,20}$/
  if (!phoneRegex.test(phone.trim())) {
    if (req.file) fs.unlinkSync(req.file.path)
    return res.status(400).json({ error: 'Format de téléphone invalide' })
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Fichier vidéo obligatoire' })
  }

  // Vérification campagne active
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
  if (!campaign) {
    fs.unlinkSync(req.file.path)
    return res.status(404).json({ error: 'Campagne introuvable' })
  }
  if (new Date(campaign.deadline) < new Date()) {
    fs.unlinkSync(req.file.path)
    return res.status(400).json({ error: 'La date limite de participation est dépassée' })
  }

  // Chemin relatif du fichier vidéo depuis uploads/
  const uploadsRoot = path.join(path.dirname(req.file.path), '..', '..')
  const videoRelPath = path.relative(
    path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../uploads'),
    req.file.path
  )

  const submission = await prisma.submission.create({
    data: {
      campaignId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      videoPath: videoRelPath,
      status: 'PENDING',
    },
  })

  res.status(201).json(submission)
}

export async function updateSubmissionStatus(req, res) {
  const { id } = req.params
  const { status: newStatus } = req.body

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { campaign: true, contract: true },
  })

  if (!submission) {
    return res.status(404).json({ error: 'Candidature introuvable' })
  }

  // Vérification de la transition de statut
  const allowedTransitions = STATUS_TRANSITIONS[submission.status] || []
  if (!allowedTransitions.includes(newStatus)) {
    return res.status(400).json({
      error: `Transition de statut invalide : ${submission.status} → ${newStatus}. Transitions autorisées : ${allowedTransitions.join(', ') || 'aucune'}`,
    })
  }

  // Réouverture d'un refus → validation : uniquement avant la fin de la campagne
  if (submission.status === 'REJECTED' && newStatus === 'VALIDATED_NO_CONTRACT') {
    if (new Date(submission.campaign.deadline) < new Date()) {
      return res.status(400).json({ error: 'La campagne est terminée, il n\'est plus possible de modifier un refus.' })
    }
  }

  // Mise à jour du statut
  const updated = await prisma.submission.update({
    where: { id },
    data: { status: newStatus },
    include: { campaign: true, contract: true },
  })

  // ─── Actions secondaires selon le nouveau statut ───────────────
  // Mail de refus : envoyé après la fin de la campagne (déclenché par listSubmissions)

  if (newStatus === 'VALIDATED_NO_CONTRACT') {
    // Créer le contrat avec un token unique
    const token = randomBytes(32).toString('hex')
    await prisma.contract.create({
      data: {
        submissionId: id,
        token,
      },
    })
    await logContractEmail(updated, token)
  }

  if (newStatus === 'COMPLETED') {
    await logRetributionEmail(updated, updated.campaign.title, updated.campaign.reward)
  }

  res.json(updated)
}

export async function getSubmissionVideo(req, res) {
  const { id } = req.params
  const user = req.user

  const submission = await prisma.submission.findUnique({ where: { id } })
  if (!submission) {
    return res.status(404).json({ error: 'Candidature introuvable' })
  }

  // Le rôle Média ne peut télécharger que les vidéos des candidatures "Terminées"
  const isDownload = req.query.download === 'true'
  if (user.role === 'MEDIA' && isDownload && submission.status !== 'COMPLETED') {
    return res.status(403).json({ error: 'Téléchargement non autorisé pour ce statut' })
  }

  const filePath = getAbsolutePath(submission.videoPath)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier vidéo introuvable' })
  }

  if (isDownload) {
    res.download(filePath)
  } else {
    // Streaming pour la lecture
    const stat = fs.statSync(filePath)
    const range = req.headers.range

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
      const chunkSize = end - start + 1
      const stream = fs.createReadStream(filePath, { start, end })
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      })
      stream.pipe(res)
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'video/mp4',
      })
      fs.createReadStream(filePath).pipe(res)
    }
  }
}
