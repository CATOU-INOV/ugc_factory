// PAGE F1 — Campagne publique
// Route : /campagne/:slug
// Mobile-first, accessible sans authentification

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCampaignPublic } from '../../api/campaigns.js'
import PhotoGallery from '../../components/PhotoGallery.jsx'

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function getDaysRemaining(deadline) {
  const diff = new Date(deadline) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 60 * 24))
}

// Icônes SVG inline, aria-hidden
function IconClipboard() {
  return (
    <svg aria-hidden="true" className="w-4 h-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg aria-hidden="true" className="w-4 h-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function IconGift() {
  return (
    <svg aria-hidden="true" className="w-4 h-4 shrink-0 text-orchestra-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12v10H4V12M2 7h20v5H2V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg aria-hidden="true" className="w-5 h-5 shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function IconX() {
  return (
    <svg aria-hidden="true" className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function IconWarning() {
  return (
    <svg aria-hidden="true" className="w-4 h-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}

export default function CampaignPublicPage() {
  const { slug } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getCampaignPublic(slug)
      .then(setCampaign)
      .catch(() => setError('Cette campagne est introuvable ou n\'est plus disponible.'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Chargement de la campagne">
        <div className="h-8 w-3/4 bg-gray-200 rounded-lg" />
        <div className="h-8 w-32 bg-gray-100 rounded-full" />
        <div className="h-24 bg-gray-100 rounded-xl" />
        <div className="h-16 bg-blue-50 rounded-xl" />
        <div className="h-16 bg-gray-50 rounded-xl" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-pretty">{error}</p>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(campaign.deadline)
  const isExpired = !campaign.isActive

  return (
    <div className="space-y-6">
      {/* En-tête campagne */}
      <div>
        <h1 className="text-2xl font-display font-black uppercase text-gray-900 leading-tight text-balance">
          {campaign.title}
        </h1>

        {/* Indicateur date */}
        <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isExpired
            ? 'bg-gray-100 text-gray-600'
            : daysRemaining <= 3
            ? 'bg-red-50 text-red-700 border border-red-200'
            : daysRemaining <= 7
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <span
            aria-hidden="true"
            className={`w-2 h-2 rounded-full ${isExpired ? 'bg-gray-400' : daysRemaining <= 3 ? 'bg-red-500' : 'bg-green-500'}`}
          />
          {isExpired
            ? 'Campagne terminée'
            : daysRemaining === 0
            ? 'Dernier jour !'
            : `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`
          }
        </div>
        <p className="text-sm text-gray-500 mt-2 tabular-nums">Date limite : {formatDate(campaign.deadline)}</p>
      </div>

      {/* Photos de référence */}
      {campaign.photos?.length > 0 && (
        <div>
          <PhotoGallery photos={campaign.photos} campaignId={campaign.id} />
        </div>
      )}

      {/* Brief */}
      <div className="space-y-4">
        {/* Éléments à montrer */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <IconClipboard />
            Informations sur la campagne
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-line text-pretty">{campaign.elementsToShow}</p>
        </div>

        {/* Wordings */}
        {campaign.wordings && (
          <div className="bg-blue-50 rounded-xl p-4">
            <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <IconChat />
              Exemples de phrases
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-line text-pretty">{campaign.wordings}</p>
          </div>
        )}

        {/* Enfants */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white">
          {campaign.childrenAllowed ? <IconCheck /> : <IconX />}
          <p className="text-sm font-medium text-gray-700">
            {campaign.childrenAllowed
              ? 'Les enfants peuvent apparaître dans la vidéo'
              : 'Les enfants ne doivent pas apparaître dans la vidéo'
            }
          </p>
        </div>

        {/* Rétribution */}
        <div className="bg-orchestra-red-bg rounded-xl p-4 border border-red-100">
          <h2 className="font-semibold text-orchestra-red-dark mb-1 flex items-center gap-2">
            <IconGift />
            Rétribution
          </h2>
          <p className="text-sm font-medium text-gray-800 text-pretty">{campaign.reward}</p>
          <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5 text-pretty">
            <IconWarning />
            La sélection n'est pas garantie. Chaque participation sera examinée par notre comité.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-4">
        {isExpired ? (
          <div className="text-center py-6">
            <p className="text-gray-500 font-medium">Cette campagne est terminée.</p>
            <p className="text-sm text-gray-400 mt-1">Les participations ne sont plus acceptées.</p>
          </div>
        ) : (
          <Link
            to={`/campagne/${slug}/participer`}
            className="btn-orchestra w-full text-center block text-base py-4"
          >
            JE PARTICIPE →
          </Link>
        )}
      </div>
    </div>
  )
}
