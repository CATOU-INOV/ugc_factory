// Service Email — Simulation par log en base de données
// Aucun email réel n'est envoyé.
// Chaque événement déclenchant normalement un email crée un EmailLog en DB.

import prisma from '../lib/prisma.js'

/**
 * Types d'emails simulés
 */
export const EMAIL_TYPES = {
  REJECTION: 'REJECTION',           // Vidéo refusée
  ACCEPTANCE: 'ACCEPTANCE',         // Vidéo acceptée
  CONTRACT_SENT: 'CONTRACT_SENT',   // Lien de signature envoyé
  RETRIBUTION_SENT: 'RETRIBUTION_SENT', // Rétribution envoyée
}

/**
 * Log un email de refus
 */
export async function logRejectionEmail(submission) {
  return prisma.emailLog.create({
    data: {
      type: EMAIL_TYPES.REJECTION,
      recipientEmail: submission.email,
      submissionId: submission.id,
      campaignId: submission.campaignId,
      summary: `Votre participation à la campagne a été refusée. Merci de votre intérêt pour Orchestra.`,
    },
  })
}

/**
 * Log un email d'acceptation avec lien de signature du contrat
 * @param {object} submission
 * @param {string} contractToken - Token unique du contrat
 * @param {string} frontendUrl - URL base du front-office
 */
export async function logContractEmail(submission, contractToken, frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173') {
  const signingUrl = `${frontendUrl}/contrat/${contractToken}`
  return prisma.emailLog.create({
    data: {
      type: EMAIL_TYPES.CONTRACT_SENT,
      recipientEmail: submission.email,
      submissionId: submission.id,
      campaignId: submission.campaignId,
      summary: `Félicitations ! Votre participation a été sélectionnée. Veuillez signer votre contrat à l'adresse : ${signingUrl}`,
    },
  })
}

/**
 * Log un email de notification de rétribution
 */
export async function logRetributionEmail(submission, campaignTitle, reward) {
  return prisma.emailLog.create({
    data: {
      type: EMAIL_TYPES.RETRIBUTION_SENT,
      recipientEmail: submission.email,
      submissionId: submission.id,
      campaignId: submission.campaignId,
      summary: `Votre rétribution pour la campagne "${campaignTitle}" a été envoyée : ${reward}. Merci pour votre contribution !`,
    },
  })
}
