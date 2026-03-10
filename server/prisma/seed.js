// ─────────────────────────────────────────────────────────────────
// Seed — Données de test POC UGC Factory Orchestra
// Usage : npm run seed (depuis server/)
// ─────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateContractPDF } from '../src/services/pdfService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_ROOT = path.join(__dirname, '../uploads')
const prisma = new PrismaClient()

// ─── Vidéo MP4 minimale valide (~1KB) ────────────────────────────
// Buffer MP4 minimaliste valide pour le seed (pas de vraie vidéo).
// Généré depuis un MP4 vide connu : ftyp + mdat boxes.
// En production, utiliser de vraies vidéos ou ffmpeg.
const MINIMAL_MP4_BASE64 =
  'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA2htZGF0AAAAEmNvbG9y' +
  'AAAAAAAAAAAAAAQfmoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHZtdmhkAAAAAAAAAAAAAAAA' +
  'AAAAdAAAAGQAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAABRpb2RzAAAAABCAgIAHgQAB//8AAAAkdHJhaw' +
  'AAAFx0a2hkAAAAAwAAAAAAAAAAAAAAAQAAAAAAAABkAAAAAAAAAAAAAAABAQAAAAABAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAEAAAAAA4bWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAA' +
  'AHQAAAAoVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAAA6' +
  'm1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAA' +
  'AAABHAgAAANzdGJsAAAAq3N0c2QAAAAAAAAAAQAAAJthdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAA' +
  'AAAAIAAoAASAAAAIAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAA' +
  'NWF2Y0MBTUAf/+EAGGdNQB9oJCeIAAAAAwCAAAAPA8WLZYABAAZo6+PLIsAAAAxidHJ0AAAAAAAAAA' +
  'AAAAAAAAAAAAEAAAAKc3R0cwAAAAAAAAABAAAABQAAAAoAAAAUc3RzcwAAAAAAAAABAAAAAQAAABhzdH' +
  'NjAAAAAAAAAAEAAAABAAAABQAAAAEAAAA0c3RzegAAAAAAAAAAAAAABQAAAAoAAAAKAAAACgAAAAoAAAA' +
  'KAAAAFHNkdHMAAAAAAAAAAQAAAAUAAAABAAAABHN0Y28AAAAAAAAAAQAAADAAAABidWR0YQAAAFptZXRh' +
  'AAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJaN0b28AAAAdZGF0' +
  'YQAAAAEAAAAATGF2ZjU4LjIwLjEwMA=='

function getMinimalMp4Buffer() {
  try {
    return Buffer.from(MINIMAL_MP4_BASE64, 'base64')
  } catch {
    // Fallback : buffer minimal valide
    return Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
      0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
      0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
      0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65, // free box
    ])
  }
}

async function saveTestVideo(campaignId, filename) {
  const dir = path.join(UPLOADS_ROOT, 'videos', campaignId)
  fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, filename)
  fs.writeFileSync(filePath, getMinimalMp4Buffer())
  return `videos/${campaignId}/${filename}`
}

async function main() {
  console.log('🌱 Démarrage du seed...')

  // ─── Nettoyage ───────────────────────────────────────────────────
  await prisma.emailLog.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.user.deleteMany()
  console.log('🗑️  Base de données nettoyée')

  // ─── Utilisateurs back-office ───────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10)
  const mediaPassword = await bcrypt.hash('media123', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@orchestra.fr',
      password: adminPassword,
      firstName: 'Sophie',
      lastName: 'Administrateur',
      role: 'ADMIN',
    },
  })

  const mediaUser = await prisma.user.create({
    data: {
      email: 'media@orchestra.fr',
      password: mediaPassword,
      firstName: 'Thomas',
      lastName: 'Médiathèque',
      role: 'MEDIA',
    },
  })

  console.log('👤 Utilisateurs créés : admin@orchestra.fr / media@orchestra.fr')

  // ─── Campagnes ──────────────────────────────────────────────────
  const now = new Date()
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const past60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const campaign1 = await prisma.campaign.create({
    data: {
      slug: 'rentree-scolaire-2024',
      title: 'Rentrée Scolaire 2024',
      deadline: in14Days,
      wordings: 'Montrez votre enthousiasme pour la rentrée ! Quelques phrases suggérées : "On est prêts pour la rentrée chez Orchestra !", "Les meilleures tenues de rentrée, c\'est chez Orchestra !"',
      elementsToShow: 'Les vêtements Orchestra portés par vos enfants, l\'ambiance familiale et joyeuse, les sacs à dos et fournitures. Ne pas montrer : logos concurrents, lieux identifiables sans autorisation.',
      childrenAllowed: true,
      reward: 'Bon d\'achat Orchestra de 50€',
    },
  })

  const campaign2 = await prisma.campaign.create({
    data: {
      slug: 'noel-orchestra-2024',
      title: 'Noël Orchestra 2024',
      deadline: in30Days,
      wordings: 'Faites briller la magie de Noël ! Idées de textes : "Cette année, Noël sera magique avec Orchestra", "Les plus beaux cadeaux viennent d\'Orchestra"',
      elementsToShow: 'Décorations de Noël, cadeaux Orchestra, moments en famille. Ne pas montrer : visages sans autorisation explicite, marques concurrentes.',
      childrenAllowed: true,
      reward: 'Bon d\'achat Orchestra de 75€ + mise en avant sur les réseaux sociaux Orchestra',
    },
  })

  const campaign3 = await prisma.campaign.create({
    data: {
      slug: 'ete-familia-2024',
      title: 'Été Familia 2024',
      deadline: past60Days,
      wordings: null,
      elementsToShow: 'Collections été Orchestra, ambiance vacances, activités estivales en famille. Ne pas montrer : maillots de bain de concurrents, lieux trop identifiables.',
      childrenAllowed: true,
      reward: 'Bon d\'achat Orchestra de 60€',
    },
  })

  console.log('📢 Campagnes créées')

  // ─── Membres fictifs (10 participants) ──────────────────────────
  const membres = [
    { firstName: 'Marie', lastName: 'Dupont', email: 'marie.dupont@gmail.com', phone: '06 12 34 56 78', address: '12 rue des Lilas, 75020 Paris' },
    { firstName: 'Jean', lastName: 'Martin', email: 'jean.martin@orange.fr', phone: '07 23 45 67 89', address: '5 avenue Victor Hugo, 69006 Lyon' },
    { firstName: 'Sophie', lastName: 'Bernard', email: 's.bernard@free.fr', phone: '06 34 56 78 90', address: '23 boulevard Gambetta, 13001 Marseille' },
    { firstName: 'Pierre', lastName: 'Moreau', email: 'pierre.moreau@hotmail.fr', phone: '07 45 67 89 01', address: '8 rue Jean Jaurès, 31000 Toulouse' },
    { firstName: 'Isabelle', lastName: 'Laurent', email: 'isabelle.laurent@gmail.com', phone: '06 56 78 90 12', address: '34 rue de la Paix, 06000 Nice' },
    { firstName: 'François', lastName: 'Simon', email: 'f.simon@sfr.fr', phone: '07 67 89 01 23', address: '2 place du Capitole, 31000 Toulouse' },
    { firstName: 'Nathalie', lastName: 'Michel', email: 'n.michel@wanadoo.fr', phone: '06 78 90 12 34', address: '15 allée des Roses, 67000 Strasbourg' },
    { firstName: 'Éric', lastName: 'Lefebvre', email: 'eric.lefebvre@gmail.com', phone: '07 89 01 23 45', address: '7 rue du Commerce, 44000 Nantes' },
    { firstName: 'Céline', lastName: 'Garcia', email: 'celine.garcia@gmail.com', phone: '06 90 12 34 56', address: '19 boulevard de la Liberté, 59000 Lille' },
    { firstName: 'Marc', lastName: 'Rousseau', email: 'marc.rousseau@outlook.fr', phone: '07 01 23 45 67', address: '28 rue Carnot, 33000 Bordeaux' },
  ]

  // ─── Soumissions Campagne 1 (5 soumissions, statuts variés) ────
  const videoPath1a = await saveTestVideo(campaign1.id, '001-marie-dupont.mp4')
  const sub1a = await prisma.submission.create({
    data: {
      campaignId: campaign1.id,
      ...membres[0],
      videoPath: videoPath1a,
      status: 'PENDING',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  })

  const videoPath1b = await saveTestVideo(campaign1.id, '002-jean-martin.mp4')
  const sub1b = await prisma.submission.create({
    data: {
      campaignId: campaign1.id,
      ...membres[1],
      videoPath: videoPath1b,
      status: 'VIDEO_VIEWED',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  })

  const videoPath1c = await saveTestVideo(campaign1.id, '003-sophie-bernard.mp4')
  const sub1c = await prisma.submission.create({
    data: {
      campaignId: campaign1.id,
      ...membres[2],
      videoPath: videoPath1c,
      status: 'VALIDATED_NO_CONTRACT',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  })

  // Créer le contrat pour sub1c
  const contract1c = await prisma.contract.create({
    data: { submissionId: sub1c.id, token: randomUUID() },
  })

  await prisma.emailLog.create({
    data: {
      type: 'CONTRACT_SENT',
      recipientEmail: membres[2].email,
      submissionId: sub1c.id,
      campaignId: campaign1.id,
      summary: `Félicitations ! Votre participation a été sélectionnée. Veuillez signer votre contrat à l'adresse : http://localhost:5173/contrat/${contract1c.token}`,
    },
  })

  const videoPath1d = await saveTestVideo(campaign1.id, '004-pierre-moreau.mp4')
  const sub1d = await prisma.submission.create({
    data: {
      campaignId: campaign1.id,
      ...membres[3],
      videoPath: videoPath1d,
      status: 'VALIDATED',
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Contrat signé pour sub1d
  const contract1d = await prisma.contract.create({
    data: {
      submissionId: sub1d.id,
      token: randomUUID(),
      signedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  })

  const videoPath1e = await saveTestVideo(campaign1.id, '005-isabelle-laurent.mp4')
  const sub1e = await prisma.submission.create({
    data: {
      campaignId: campaign1.id,
      ...membres[4],
      videoPath: videoPath1e,
      status: 'COMPLETED',
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
  })

  // Contrat signé + PDF pour sub1e
  const pdfPath1e = await generateContractPDF(
    { ...membres[4], id: sub1e.id, campaignId: campaign1.id },
    { title: campaign1.title, reward: campaign1.reward },
    `contract-${sub1e.id}`
  )
  const contract1e = await prisma.contract.create({
    data: {
      submissionId: sub1e.id,
      token: randomUUID(),
      signedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      pdfPath: pdfPath1e,
    },
  })

  await prisma.emailLog.create({
    data: {
      type: 'RETRIBUTION_SENT',
      recipientEmail: membres[4].email,
      submissionId: sub1e.id,
      campaignId: campaign1.id,
      summary: `Votre rétribution pour la campagne "Rentrée Scolaire 2024" a été envoyée : ${campaign1.reward}. Merci pour votre contribution !`,
    },
  })

  console.log('📹 Soumissions campagne 1 créées (5 soumissions, statuts variés)')

  // ─── Soumissions Campagne 2 (2 en attente) ──────────────────────
  const videoPath2a = await saveTestVideo(campaign2.id, '001-francois-simon.mp4')
  await prisma.submission.create({
    data: {
      campaignId: campaign2.id,
      ...membres[5],
      videoPath: videoPath2a,
      status: 'PENDING',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  })

  const videoPath2b = await saveTestVideo(campaign2.id, '002-nathalie-michel.mp4')
  await prisma.submission.create({
    data: {
      campaignId: campaign2.id,
      ...membres[6],
      videoPath: videoPath2b,
      status: 'PENDING',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('📹 Soumissions campagne 2 créées (2 en attente)')

  // ─── Soumissions Campagne 3 (3 terminées) ───────────────────────
  for (let i = 0; i < 3; i++) {
    const membre = membres[7 + i]
    const videoPath = await saveTestVideo(campaign3.id, `00${i + 1}-${membre.firstName.toLowerCase()}-${membre.lastName.toLowerCase()}.mp4`)
    const sub = await prisma.submission.create({
      data: {
        campaignId: campaign3.id,
        ...membre,
        videoPath,
        status: 'COMPLETED',
        createdAt: new Date(now.getTime() - (70 + i * 5) * 24 * 60 * 60 * 1000),
      },
    })

    const pdfPath = await generateContractPDF(
      { ...membre, id: sub.id, campaignId: campaign3.id },
      { title: campaign3.title, reward: campaign3.reward },
      `contract-${sub.id}`
    )

    await prisma.contract.create({
      data: {
        submissionId: sub.id,
        token: randomUUID(),
        signedAt: new Date(now.getTime() - (65 + i * 5) * 24 * 60 * 60 * 1000),
        pdfPath,
      },
    })

    await prisma.emailLog.create({
      data: {
        type: 'RETRIBUTION_SENT',
        recipientEmail: membre.email,
        submissionId: sub.id,
        campaignId: campaign3.id,
        summary: `Votre rétribution pour la campagne "Été Familia 2024" a été envoyée : ${campaign3.reward}.`,
      },
    })
  }

  console.log('📹 Soumissions campagne 3 créées (3 terminées)')

  // ─── Emails de refus (log) ───────────────────────────────────────
  // Simuler un refus sur sub1b (VIDEO_VIEWED → aurait pu être refusée, on garde VIDEO_VIEWED)
  // Ajout d'un log de refus pour illustrer le cas

  console.log('\n✅ Seed terminé avec succès !')
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📌 Comptes de test :')
  console.log('   Admin : admin@orchestra.fr / admin123')
  console.log('   Média : media@orchestra.fr / media123')
  console.log('\n📢 Campagnes créées :')
  console.log(`   [EN COURS] Rentrée Scolaire 2024 — /campagne/rentree-scolaire-2024`)
  console.log(`   [EN COURS] Noël Orchestra 2024 — /campagne/noel-orchestra-2024`)
  console.log(`   [TERMINÉE] Été Familia 2024`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch(e => {
    console.error('❌ Erreur lors du seed :', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
