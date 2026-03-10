// PAGE M2 — Campagne en cours (Média)
// Route : /media/campagne/:id
// Galerie vidéo — téléchargement uniquement pour les vidéos COMPLETED

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCampaignById } from '../../api/campaigns.js'
import { getSubmissions, getVideoUrl, getVideoDownloadUrl } from '../../api/submissions.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import PhotoGallery from '../../components/PhotoGallery.jsx'

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function VideoThumbnail({ sub, onPlay }) {
  const canDownload = sub.status === 'COMPLETED'
  const token = localStorage.getItem('ugcfactory_token')

  const handleDownload = () => {
    fetch(getVideoDownloadUrl(sub.id), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `video-${sub.lastName}-${sub.firstName}.mp4`
        a.click()
        URL.revokeObjectURL(url)
      })
  }

  return (
    <div className="card overflow-hidden group">
      {/* Zone vidéo — cliquable + keyboard */}
      <button
        className="relative w-full aspect-video bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orchestra-red focus-visible:ring-inset"
        onClick={onPlay}
        aria-label={`Lire la vidéo de ${sub.firstName} ${sub.lastName} en plein écran`}
      >
        <video
          className="w-full h-full object-cover pointer-events-none"
          src={`${getVideoUrl(sub.id)}?token=${token}`}
          preload="metadata"
          muted
          tabIndex={-1}
          onMouseEnter={e => e.target.play()}
          onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0 }}
        />
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-md">
            <svg aria-hidden="true" className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
            </svg>
          </div>
        </div>
      </button>

      {/* Infos */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{sub.firstName} {sub.lastName}</p>
            <p className="text-xs text-gray-400 mt-0.5 tabular-nums">{formatDate(sub.createdAt)}</p>
          </div>
          <StatusBadge status={sub.status} />
        </div>

        {canDownload ? (
          <button
            onClick={handleDownload}
            className="w-full text-xs font-semibold text-orchestra-red hover:text-orchestra-red-dark flex items-center justify-center gap-1.5 transition-colors py-1"
            aria-label={`Télécharger la vidéo de ${sub.firstName} ${sub.lastName}`}
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Télécharger
          </button>
        ) : (
          <p className="text-xs text-gray-400 text-center py-1">Disponible après validation complète</p>
        )}
      </div>
    </div>
  )
}

function VideoModal({ submissionId, onClose }) {
  const token = localStorage.getItem('ugcfactory_token')
  const closeRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Lecteur vidéo plein écran"
        className="relative w-full max-w-4xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white font-semibold flex items-center gap-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
          aria-label="Fermer le lecteur vidéo"
        >
          Fermer
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <video
          controls
          autoPlay
          className="w-full rounded-lg"
          src={`${getVideoUrl(submissionId)}?token=${token}`}
        />
      </div>
    </div>
  )
}

export default function MediaCampaignActive() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [playingVideo, setPlayingVideo] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [camp, subs] = await Promise.all([
        getCampaignById(id),
        getSubmissions(id),
      ])
      setCampaign(camp)
      setSubmissions(subs.filter(s => s.status === 'PENDING' || s.status === 'COMPLETED'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Chargement de la galerie">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card h-64 bg-gray-50" />
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="card h-40 bg-gray-50" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) return <p className="text-gray-500">Campagne introuvable.</p>

  return (
    <div className="space-y-6">
      <nav aria-label="Fil d'Ariane" className="text-sm text-gray-500">
        <Link to="/media" className="hover:text-orchestra-red transition-colors">Accueil</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-gray-900 font-medium">{campaign.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brief */}
        <div className="lg:col-span-1">
          <div className="card p-6 space-y-4 sticky top-24">
            <h2 className="font-display font-bold uppercase text-gray-900">Brief</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Campagne</p>
                <p className="text-gray-600">{campaign.title}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Date limite</p>
                <p className="text-gray-600 tabular-nums">{formatDate(campaign.deadline)}</p>
              </div>
              {campaign.wordings && (
                <div>
                  <p className="font-semibold text-gray-700">Wordings</p>
                  <p className="text-gray-600 whitespace-pre-line text-pretty">{campaign.wordings}</p>
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-700">Éléments à montrer</p>
                <p className="text-gray-600 whitespace-pre-line text-pretty">{campaign.elementsToShow}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Enfants</p>
                <p className="text-gray-600">{campaign.childrenAllowed ? 'Autorisés' : 'Non autorisés'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Rétribution</p>
                <p className="text-gray-600">{campaign.reward}</p>
              </div>
            </div>

            {campaign.photos?.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="font-semibold text-gray-700 text-sm mb-2">Photos de référence</p>
                <PhotoGallery photos={campaign.photos} campaignId={campaign.id} />
              </div>
            )}
          </div>
        </div>

        {/* Galerie */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold uppercase text-gray-900">
              Contenus{' '}
              <span className="text-gray-400 font-normal tabular-nums">({submissions.length})</span>
            </h2>
          </div>

          {submissions.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-gray-400 text-sm">Aucun contenu déposé pour cette campagne.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {submissions.map(sub => (
                <VideoThumbnail
                  key={sub.id}
                  sub={sub}
                  onPlay={() => setPlayingVideo(sub.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lecteur plein écran */}
      {playingVideo && (
        <VideoModal
          submissionId={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </div>
  )
}
