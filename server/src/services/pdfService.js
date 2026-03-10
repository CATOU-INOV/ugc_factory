// Service de génération PDF — Contrat de cession de droits
// Utilise pdf-lib (pure JavaScript, aucun binaire natif requis)

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomBytes } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTRACTS_DIR = path.join(__dirname, '../../uploads/contracts')

/**
 * Génère un PDF de contrat de cession de droits à l'image et à la vidéo
 * @param {object} submission - Données du participant
 * @param {object} campaign - Données de la campagne
 * @param {string} contractId - ID du contrat (pour le nom de fichier)
 * @returns {string} Chemin relatif du PDF généré (depuis uploads/)
 */
export async function generateContractPDF(submission, campaign, contractId) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // Format A4
  const { width, height } = page.getSize()

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const red = rgb(0.894, 0.055, 0.125) // #e40e20 Orchestra
  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)

  const marginLeft = 60
  const marginRight = 60
  const contentWidth = width - marginLeft - marginRight
  let y = height - 60

  // ─── En-tête ───────────────────────────────────────────────────
  // Logo texte Orchestra
  page.drawText('ORCHESTRA', {
    x: marginLeft,
    y,
    size: 22,
    font: fontBold,
    color: red,
  })
  y -= 8
  page.drawLine({ start: { x: marginLeft, y }, end: { x: width - marginRight, y }, thickness: 2, color: red })
  y -= 30

  // Titre du document
  page.drawText('CONTRAT DE CESSION DE DROITS À L\'IMAGE ET À LA VIDÉO', {
    x: marginLeft,
    y,
    size: 13,
    font: fontBold,
    color: black,
  })
  y -= 25

  // Sous-titre campagne
  page.drawText(`Campagne : ${campaign.title}`, {
    x: marginLeft,
    y,
    size: 11,
    font: fontRegular,
    color: gray,
  })
  y -= 8

  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  page.drawText(`Date d'émission : ${dateStr}`, {
    x: marginLeft,
    y,
    size: 11,
    font: fontRegular,
    color: gray,
  })
  y -= 30

  // ─── Parties ───────────────────────────────────────────────────
  page.drawText('ENTRE LES SOUSSIGNÉS', { x: marginLeft, y, size: 11, font: fontBold, color: black })
  y -= 20

  // Cessionnaire
  page.drawText('D\'une part,', { x: marginLeft, y, size: 10, font: fontBold, color: black })
  y -= 14
  const cessionnaire = [
    'La société Orchestra, société par actions simplifiée,',
    'dont le siège social est situé à Montpellier (34),',
    'ci-après dénommée « Orchestra »,',
  ]
  for (const line of cessionnaire) {
    page.drawText(line, { x: marginLeft + 10, y, size: 10, font: fontRegular, color: black })
    y -= 14
  }
  y -= 10

  // Cédant
  page.drawText('Et d\'autre part,', { x: marginLeft, y, size: 10, font: fontBold, color: black })
  y -= 14
  const cedantLines = [
    `M./Mme ${submission.firstName} ${submission.lastName}`,
    `Adresse : ${submission.address}`,
    `Email : ${submission.email}`,
    `Téléphone : ${submission.phone}`,
    'ci-après dénommé(e) « le Cédant »,',
  ]
  for (const line of cedantLines) {
    page.drawText(line, { x: marginLeft + 10, y, size: 10, font: fontRegular, color: black })
    y -= 14
  }
  y -= 20

  // ─── Corps du contrat ───────────────────────────────────────────
  const sections = [
    {
      title: 'ARTICLE 1 — OBJET',
      content: [
        'Le Cédant autorise Orchestra à utiliser, reproduire, représenter, diffuser et exploiter',
        `la vidéo soumise dans le cadre de la campagne « ${campaign.title} » (ci-après « le Contenu »)`,
        'sur tout support, en France et à l\'international, à des fins promotionnelles et commerciales.',
      ],
    },
    {
      title: 'ARTICLE 2 — ÉTENDUE DE LA CESSION',
      content: [
        'La présente cession de droits porte sur les droits de reproduction, de représentation,',
        'd\'adaptation, de traduction et d\'exploitation du Contenu sous toute forme connue ou',
        'inconnue à ce jour, incluant notamment : supports numériques, réseaux sociaux, site web,',
        'publicités en ligne, supports imprimés, et tout autre média de communication.',
      ],
    },
    {
      title: 'ARTICLE 3 — DURÉE',
      content: [
        'La présente cession est consentie pour une durée déterminée fixée dans les conditions',
        'particulières de la campagne, à compter de la date de signature du présent contrat.',
      ],
    },
    {
      title: 'ARTICLE 4 — RÉTRIBUTION',
      content: [
        `En contrepartie de cette cession, Orchestra s\'engage à fournir au Cédant : ${campaign.reward}.`,
        'Cette rétribution est forfaitaire et ne saurait ouvrir droit à aucune autre rémunération.',
      ],
    },
    {
      title: 'ARTICLE 5 — GARANTIES',
      content: [
        'Le Cédant garantit être l\'auteur et le seul titulaire des droits sur le Contenu,',
        'et que ce Contenu ne porte pas atteinte aux droits de tiers. En cas de litige,',
        'le Cédant s\'engage à garantir Orchestra de tout recours de tiers.',
      ],
    },
  ]

  for (const section of sections) {
    if (y < 150) {
      // Nouvelle page si nécessaire
      const newPage = pdfDoc.addPage([595, 842])
      y = newPage.getSize().height - 60
      // On re-dessine sur la nouvelle page — simple implémentation POC
    }

    page.drawText(section.title, { x: marginLeft, y, size: 10, font: fontBold, color: red })
    y -= 16
    for (const line of section.content) {
      page.drawText(line, { x: marginLeft, y, size: 9, font: fontRegular, color: black })
      y -= 13
    }
    y -= 12
  }

  // ─── Signatures ─────────────────────────────────────────────────
  y -= 20
  if (y > 150) {
    page.drawLine({ start: { x: marginLeft, y }, end: { x: width - marginRight, y }, thickness: 0.5, color: gray })
    y -= 25

    page.drawText('Fait à _____________, le ' + dateStr, { x: marginLeft, y, size: 10, font: fontRegular, color: black })
    y -= 30

    // Deux colonnes de signature
    page.drawText('Pour Orchestra :', { x: marginLeft, y, size: 10, font: fontBold, color: black })
    page.drawText('Le Cédant :', { x: width / 2, y, size: 10, font: fontBold, color: black })
    y -= 50

    // Ligne de signature simulée
    page.drawText('[Signature Orchestra]', { x: marginLeft, y, size: 9, font: fontRegular, color: gray })
    page.drawText(`[Signé électroniquement]`, { x: width / 2, y, size: 9, font: fontRegular, color: gray })
    y -= 14
    page.drawText('', { x: marginLeft, y, size: 9, font: fontRegular, color: black })
    page.drawText(`${submission.firstName} ${submission.lastName}`, { x: width / 2, y, size: 9, font: fontRegular, color: black })
  }

  // ─── Pied de page ───────────────────────────────────────────────
  page.drawText('Document généré automatiquement — POC UGC Factory Orchestra', {
    x: marginLeft,
    y: 30,
    size: 7,
    font: fontRegular,
    color: gray,
  })

  // ─── Sauvegarde ─────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save()
  const filename = `${randomBytes(16).toString('hex')}.pdf`
  const filePath = path.join(CONTRACTS_DIR, filename)
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true })
  fs.writeFileSync(filePath, pdfBytes)

  // Retourne le chemin relatif depuis uploads/
  return `contracts/${filename}`
}
