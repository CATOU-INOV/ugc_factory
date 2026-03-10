import prisma from '../lib/prisma.js'
import { generateContractPDF } from '../services/pdfService.js'
import { getAbsolutePath } from '../services/storageService.js'
import fs from 'fs'

export async function listContracts(req, res) {
  const { search, campaignId } = req.query

  const where = {
    submission: {},
  }

  if (search) {
    const term = search.trim().slice(0, 100)
    where.submission.OR = [
      { firstName: { contains: term } },
      { lastName: { contains: term } },
    ]
  }

  if (campaignId) {
    where.submission.campaignId = campaignId
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      submission: {
        include: { campaign: { select: { id: true, title: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(contracts)
}

export async function getContractByToken(req, res) {
  const { token } = req.params

  const contract = await prisma.contract.findUnique({
    where: { token },
    include: {
      submission: {
        include: { campaign: { select: { id: true, title: true, reward: true } } },
      },
    },
  })

  if (!contract) {
    return res.status(404).json({ error: 'Contrat introuvable ou lien invalide' })
  }

  res.json(contract)
}

export async function signContract(req, res) {
  const { token } = req.params

  const contract = await prisma.contract.findUnique({
    where: { token },
    include: {
      submission: {
        include: { campaign: true },
      },
    },
  })

  if (!contract) {
    return res.status(404).json({ error: 'Contrat introuvable ou lien invalide' })
  }

  if (contract.signedAt) {
    return res.status(400).json({ error: 'Ce contrat a déjà été signé' })
  }

  if (contract.expiresAt && new Date() > new Date(contract.expiresAt)) {
    return res.status(400).json({ error: 'Ce lien de signature a expiré' })
  }

  // Générer le PDF
  const pdfPath = await generateContractPDF(
    contract.submission,
    contract.submission.campaign,
    contract.id
  )

  // Mettre à jour le contrat
  const updatedContract = await prisma.contract.update({
    where: { id: contract.id },
    data: {
      signedAt: new Date(),
      pdfPath,
    },
  })

  // Changer le statut de la soumission à VALIDATED
  // (VALIDATED_NO_CONTRACT → VALIDATED)
  await prisma.submission.update({
    where: { id: contract.submissionId },
    data: { status: 'VALIDATED' },
  })

  res.json({ success: true, contract: updatedContract })
}

export async function downloadContractPDF(req, res) {
  const { id } = req.params

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { submission: { select: { firstName: true, lastName: true } } },
  })

  if (!contract) {
    return res.status(404).json({ error: 'Contrat introuvable' })
  }

  if (!contract.pdfPath) {
    return res.status(404).json({ error: 'PDF non encore généré — le contrat n\'a pas encore été signé' })
  }

  const filePath = getAbsolutePath(contract.pdfPath)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier PDF introuvable sur le serveur' })
  }

  const filename = `contrat-${contract.submission.lastName}-${contract.submission.firstName}.pdf`
  res.download(filePath, filename)
}

/**
 * Téléchargement PDF via token (route publique — pour la page de signature)
 */
export async function downloadContractPDFByToken(req, res) {
  const { token } = req.params

  const contract = await prisma.contract.findUnique({
    where: { token },
    include: { submission: { select: { firstName: true, lastName: true } } },
  })

  if (!contract) {
    return res.status(404).json({ error: 'Contrat introuvable' })
  }

  if (!contract.pdfPath || !contract.signedAt) {
    return res.status(404).json({ error: 'PDF non disponible — le contrat n\'a pas encore été signé' })
  }

  const filePath = getAbsolutePath(contract.pdfPath)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier PDF introuvable' })
  }

  const filename = `contrat-orchestra-${contract.submission.lastName}-${contract.submission.firstName}.pdf`
  res.download(filePath, filename)
}
