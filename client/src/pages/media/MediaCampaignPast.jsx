// PAGE M3 — Campagne passée (Média)
// Route : /media/campagne-passee/:id
// Galerie — toutes les vidéos COMPLETED téléchargeables

import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCampaignById } from '../../api/campaigns.js'
import { getSubmissions, getVideoUrl, getVideoDownloadUrl } from '../../api/submissions.js'

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function MediaCampaignPast() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [playingVideo, setPlayingVideo] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [camp, subsData] = await Promise.all([
        getCampaignById(id),
        getSubmissions(id),
      ])
      setCampaign(camp)
      // Campagne passée : uniquement les COMPLETED
      setSubmissions(subsData.submissions.filter(s => s.status === 'COMPLETED'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-orchestra-red border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!campaign) return <p className="text-gray-500">Campagne introuvable.</p>

  const token = localStorage.getItem('ugcfactory_token')

  const downloadVideo = (sub) => {
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
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link to="/media" className="hover:text-orchestra-red">Accueil</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{campaign.title}</span>
        <span className="ml-2 badge bg-gray-100 text-gray-500 text-xs">Terminée</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brief */}
        <div className="lg:col-span-1">
          <div className="card p-6 space-y-4 sticky top-24">
            <h2 className="font-display font-bold uppercase text-gray-900">Brief</h2>
            <div className="space-y-3 text-sm">
              <div><p className="font-semibold text-gray-700">Campagne</p><p className="text-gray-600">{campaign.title}</p></div>
              <div><p className="font-semibold text-gray-700">Date limite</p><p className="text-gray-600">{formatDate(campaign.deadline)}</p></div>
              {campaign.wordings && <div><p className="font-semibold text-gray-700">Wordings</p><p className="text-gray-600 whitespace-pre-line">{campaign.wordings}</p></div>}
              <div><p className="font-semibold text-gray-700">Éléments à montrer</p><p className="text-gray-600 whitespace-pre-line">{campaign.elementsToShow}</p></div>
              <div><p className="font-semibold text-gray-700">Rétribution</p><p className="text-gray-600">{campaign.reward}</p></div>
            </div>
          </div>
        </div>

        {/* Galerie */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold uppercase text-gray-900">
              Contenus validés <span className="text-gray-400 font-normal">({submissions.length})</span>
            </h2>
          </div>

          {submissions.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">Aucun contenu validé.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {submissions.map(sub => (
                <div key={sub.id} className="card overflow-hidden group">
                  <div
                    className="relative aspect-video bg-gray-900 cursor-pointer"
                    onClick={() => setPlayingVideo(playingVideo === sub.id ? null : sub.id)}
                  >
                    <video
                      className="w-full h-full object-cover"
                      src={`${getVideoUrl(sub.id)}?token=${token}`}
                      preload="metadata"
                      muted
                      onMouseEnter={e => e.target.play()}
                      onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="font-semibold text-gray-900 text-sm">{sub.firstName} {sub.lastName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(sub.createdAt)}</p>
                    <button
                      onClick={() => downloadVideo(sub)}
                      className="mt-3 w-full text-xs font-semibold text-orchestra-red hover:text-orchestra-red-dark flex items-center justify-center gap-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Télécharger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lecteur plein écran */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPlayingVideo(null)}>
          <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPlayingVideo(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white font-semibold">
              Fermer ✕
            </button>
            <video controls autoPlay className="w-full rounded-lg" src={`${getVideoUrl(playingVideo)}?token=${token}`} />
          </div>
        </div>
      )}
    </div>
  )
}
