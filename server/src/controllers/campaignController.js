import prisma from '../lib/prisma.js'
import slugify from 'slugify'
import { getAbsolutePath, deleteFile } from '../services/storageService.js'
import path from 'path'

const MAX_ACTIVE_CAMPAIGNS = 3
const MAX_PHOTOS = 5

// Helper : est-ce une campagne active ?
function isActive(campaign) {
  if (campaign.closedAt) return false
  return new Date(campaign.deadline) > new Date()
}

// Helper : parse le champ products (JSON string → array)
function parseProducts(raw) {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export async function listCampaigns(req, res) {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { submissions: true } },
      photos: { orderBy: { createdAt: 'asc' } },
      submissions: {
        where: { status: { in: ['COMPLETED', 'VALIDATED_NO_CONTRACT', 'VALIDATED'] } },
        select: { id: true, status: true },
      },
    },
  })

  const result = campaigns.map(c => ({
    ...c,
    products: parseProducts(c.products),
    isActive: isActive(c),
    submissionsCount: c._count.submissions,
    completedCount: c.submissions.filter(s => s.status === 'COMPLETED').length,
    validatedCount: c.submissions.filter(s => s.status === 'VALIDATED_NO_CONTRACT' || s.status === 'VALIDATED').length,
  }))

  res.json(result)
}

export async function getCampaignPublic(req, res) {
  const { slug } = req.params

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: { photos: { orderBy: { createdAt: 'asc' } } },
  })

  if (!campaign) {
    return res.status(404).json({ error: 'Campagne introuvable' })
  }

  res.json({ ...campaign, products: parseProducts(campaign.products), isActive: isActive(campaign) })
}

export async function getCampaignById(req, res) {
  const { id } = req.params

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      _count: { select: { submissions: true } },
      photos: { orderBy: { createdAt: 'asc' } },
      submissions: { where: { status: 'COMPLETED' }, select: { id: true } },
    },
  })

  if (!campaign) {
    return res.status(404).json({ error: 'Campagne introuvable' })
  }

  res.json({
    ...campaign,
    products: parseProducts(campaign.products),
    isActive: isActive(campaign),
    submissionsCount: campaign._count.submissions,
    completedCount: campaign.submissions.length,
  })
}

export async function createCampaign(req, res) {
  const { title, deadline, wordings, elementsToShow, childrenAllowed, reward, products, contentCount, rewardAmount } = req.body

  if (!title || !deadline || !elementsToShow || !reward) {
    return res.status(400).json({ error: 'Champs obligatoires manquants : titre, date limite, éléments à montrer, rétribution' })
  }

  if (title.trim().length > 200) {
    return res.status(400).json({ error: 'Titre trop long (max 200 caractères)' })
  }
  if (elementsToShow.trim().length > 2000) {
    return res.status(400).json({ error: 'Champ "éléments à montrer" trop long (max 2000 caractères)' })
  }
  if (reward.trim().length > 500) {
    return res.status(400).json({ error: 'Rétribution trop longue (max 500 caractères)' })
  }
  if (new Date(deadline) <= new Date()) {
    return res.status(400).json({ error: 'La date limite doit être dans le futur' })
  }
  if (contentCount && (parseInt(contentCount, 10) < 1 || parseInt(contentCount, 10) > 10000)) {
    return res.status(400).json({ error: 'Nombre de contenus invalide (1–10000)' })
  }
  if (rewardAmount && (parseFloat(rewardAmount) < 0 || parseFloat(rewardAmount) > 999999)) {
    return res.status(400).json({ error: 'Montant de dotation invalide (0–999999)' })
  }

  // Vérification : max 3 campagnes actives simultanément
  const now = new Date()
  const activeCount = await prisma.campaign.count({
    where: { deadline: { gt: now } },
  })

  if (activeCount >= MAX_ACTIVE_CAMPAIGNS) {
    return res.status(400).json({
      error: `Impossible de créer une nouvelle campagne : le maximum de ${MAX_ACTIVE_CAMPAIGNS} campagnes simultanées est atteint.`,
    })
  }

  // Génération du slug unique
  let baseSlug = slugify(title, { lower: true, strict: true, locale: 'fr' })
  let slug = baseSlug
  let suffix = 1
  while (await prisma.campaign.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`
  }

  const campaign = await prisma.campaign.create({
    data: {
      slug,
      title: title.trim(),
      deadline: new Date(deadline),
      wordings: wordings?.trim() || null,
      elementsToShow: elementsToShow.trim(),
      childrenAllowed: Boolean(childrenAllowed),
      reward: reward.trim(),
      products: Array.isArray(products) && products.length > 0
        ? JSON.stringify(products)
        : null,
      contentCount: contentCount ? parseInt(contentCount, 10) : null,
      rewardAmount: rewardAmount ? parseFloat(rewardAmount) : null,
    },
  })

  res.status(201).json({ ...campaign, products: parseProducts(campaign.products), isActive: true })
}

export async function updateCampaign(req, res) {
  const { id } = req.params
  const { title, deadline, wordings, elementsToShow, childrenAllowed, reward, products, contentCount, rewardAmount } = req.body

  const existing = await prisma.campaign.findUnique({ where: { id } })
  if (!existing) {
    return res.status(404).json({ error: 'Campagne introuvable' })
  }

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      title: title?.trim() ?? existing.title,
      deadline: deadline ? new Date(deadline) : existing.deadline,
      wordings: wordings !== undefined ? (wordings?.trim() || null) : existing.wordings,
      elementsToShow: elementsToShow?.trim() ?? existing.elementsToShow,
      childrenAllowed: childrenAllowed !== undefined ? Boolean(childrenAllowed) : existing.childrenAllowed,
      reward: reward?.trim() ?? existing.reward,
      products: products !== undefined
        ? (Array.isArray(products) && products.length > 0 ? JSON.stringify(products) : null)
        : existing.products,
      contentCount: contentCount !== undefined
        ? (contentCount ? parseInt(contentCount, 10) : null)
        : existing.contentCount,
      rewardAmount: rewardAmount !== undefined
        ? (rewardAmount ? parseFloat(rewardAmount) : null)
        : existing.rewardAmount,
    },
  })

  res.json({ ...campaign, products: parseProducts(campaign.products), isActive: isActive(campaign) })
}

export async function closeCampaign(req, res) {
  const { id } = req.params

  const existing = await prisma.campaign.findUnique({ where: { id } })
  if (!existing) {
    return res.status(404).json({ error: 'Campagne introuvable' })
  }
  if (existing.closedAt) {
    return res.status(400).json({ error: 'Campagne déjà clôturée' })
  }

  const campaign = await prisma.campaign.update({
    where: { id },
    data: { closedAt: new Date() },
  })

  res.json({ ...campaign, products: parseProducts(campaign.products), isActive: false })
}

export async function deleteCampaign(req, res) {
  const { id } = req.params

  const existing = await prisma.campaign.findUnique({ where: { id } })
  if (!existing) {
    return res.status(404).json({ error: 'Campagne introuvable' })
  }

  await prisma.campaign.delete({ where: { id } })

  res.json({ success: true })
}

// ─── Photos de brief ─────────────────────────────────────────────────────────

export async function uploadCampaignPhotos(req, res) {
  const { id } = req.params

  const campaign = await prisma.campaign.findUnique({ where: { id }, include: { photos: true } })
  if (!campaign) {
    return res.status(404).json({ error: 'Campagne introuvable' })
  }

  const files = req.files || []
  if (files.length === 0) {
    return res.status(400).json({ error: 'Aucun fichier reçu' })
  }

  const remaining = MAX_PHOTOS - campaign.photos.length
  if (remaining <= 0) {
    // Supprimer les fichiers uploadés par multer avant de répondre
    for (const f of files) deleteFile(`photos/${id}/${f.filename}`)
    return res.status(400).json({ error: `Maximum ${MAX_PHOTOS} photos atteint` })
  }

  const accepted = files.slice(0, remaining)
  const rejected = files.slice(remaining)
  for (const f of rejected) deleteFile(`photos/${id}/${f.filename}`)

  const created = await prisma.$transaction(
    accepted.map(f =>
      prisma.campaignPhoto.create({
        data: { campaignId: id, filename: `photos/${id}/${f.filename}` },
      })
    )
  )

  res.status(201).json(created)
}

export async function deleteCampaignPhoto(req, res) {
  const { id, photoId } = req.params

  const photo = await prisma.campaignPhoto.findUnique({ where: { id: photoId } })
  if (!photo || photo.campaignId !== id) {
    return res.status(404).json({ error: 'Photo introuvable' })
  }

  deleteFile(photo.filename)
  await prisma.campaignPhoto.delete({ where: { id: photoId } })

  res.json({ success: true })
}

export async function serveCampaignPhoto(req, res) {
  const { id, photoId } = req.params

  const photo = await prisma.campaignPhoto.findUnique({ where: { id: photoId } })
  if (!photo || photo.campaignId !== id) {
    return res.status(404).json({ error: 'Photo introuvable' })
  }

  const absolutePath = getAbsolutePath(photo.filename)
  res.sendFile(absolutePath)
}
