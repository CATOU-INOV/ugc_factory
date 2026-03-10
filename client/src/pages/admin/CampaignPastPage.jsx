// PAGE A4 — Campagne passée (détail Admin)
// Route : /admin/campagne-passee/:id
// Seules les candidatures COMPLETED sont affichées

import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCampaignById } from '../../api/campaigns.js'
import { getSubmissions } from '../../api/submissions.js'
import { getContractPdfUrl } from '../../api/contracts.js'
import VideoPlayer from '../../components/VideoPlayer.jsx'

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function CampaignPastPage() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [sortOrder, setSortOrder] = useState('desc')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [camp, subs] = await Promise.all([
        getCampaignById(id),
        getSubmissions(id),
      ])
      setCampaign(camp)
      // Campagne passée : n'afficher que les COMPLETED
      setSubmissions(subs.filter(s => s.status === 'COMPLETED'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const sorted = [...submissions].sort((a, b) =>
    sortOrder === 'desc'
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : new Date(a.createdAt) - new Date(b.createdAt)
  )

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-orchestra-red border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!campaign) return <p className="text-gray-500">Campagne introuvable.</p>

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link to="/admin" className="hover:text-orchestra-red transition-colors">Accueil</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{campaign.title}</span>
        <span className="ml-2 badge bg-gray-100 text-gray-500 text-xs">Terminée</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brief — lecture seule */}
        <div className="lg:col-span-1">
          <div className="card p-6 space-y-4 sticky top-24">
            <h2 className="font-display font-bold uppercase text-gray-900">Brief campagne</h2>
            <div className="space-y-3 text-sm">
              <div><p className="font-semibold text-gray-700">Titre</p><p className="text-gray-600">{campaign.title}</p></div>
              <div><p className="font-semibold text-gray-700">Date limite</p><p className="text-gray-600">{formatDate(campaign.deadline)}</p></div>
              {campaign.wordings && <div><p className="font-semibold text-gray-700">Wordings</p><p className="text-gray-600 whitespace-pre-line">{campaign.wordings}</p></div>}
              <div><p className="font-semibold text-gray-700">Éléments à montrer</p><p className="text-gray-600 whitespace-pre-line">{campaign.elementsToShow}</p></div>
              <div><p className="font-semibold text-gray-700">Enfants autorisés</p><p className="text-gray-600">{campaign.childrenAllowed ? 'Oui' : 'Non'}</p></div>
              <div><p className="font-semibold text-gray-700">Rétribution</p><p className="text-gray-600">{campaign.reward}</p></div>
              {campaign.contentCount > 0 && (
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  <p className="font-semibold text-gray-700">Dotation</p>
                  <p className="text-gray-600 tabular-nums">
                    <span className="font-semibold text-gray-900">{campaign.completedCount ?? 0} / {campaign.contentCount}</span>
                    {' '}contenus validés
                  </p>
                  {campaign.rewardAmount > 0 && (
                    <p className="text-xs text-gray-500 tabular-nums">
                      {campaign.contentCount} × {campaign.rewardAmount.toLocaleString('fr-FR')} € ={' '}
                      <span className="font-semibold text-gray-700">
                        {(campaign.contentCount * campaign.rewardAmount).toLocaleString('fr-FR')} €
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Candidatures terminées */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold uppercase text-gray-900">
              Participations sélectionnées <span className="text-gray-400 font-normal ml-1">({submissions.length})</span>
              {campaign.contentCount > 0 && (
                <span className={`ml-2 badge text-xs ${submissions.length >= campaign.contentCount ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {submissions.length}/{campaign.contentCount} validés
                </span>
              )}
            </h2>
            <button
              onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              {sortOrder === 'desc' ? 'Plus récentes ↓' : 'Plus anciennes ↑'}
            </button>
          </div>

          {sorted.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <p>Aucune participation terminée pour cette campagne.</p>
            </div>
          ) : (
            <div className="overflow-x-auto card">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Participant</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Contact</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Vidéo</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Contrat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.map(sub => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 text-sm">{sub.firstName} {sub.lastName}</p>
                        <p className="text-xs text-gray-400">{sub.address}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                        <p>{sub.email}</p>
                        <p>{sub.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        {selectedVideo === sub.id ? (
                          <div className="max-w-xs">
                            <VideoPlayer submissionId={sub.id} canDownload={true} small />
                            <button onClick={() => setSelectedVideo(null)} className="text-xs text-gray-400 mt-1">Fermer</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedVideo(sub.id)}
                            className="text-sm font-medium text-orchestra-red hover:text-orchestra-red-dark flex items-center gap-1 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
                            </svg>
                            Voir / DL
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {sub.contract?.pdfPath ? (
                          <a
                            href={getContractPdfUrl(sub.contract.id)}
                            className="text-sm font-medium text-orchestra-red hover:text-orchestra-red-dark flex items-center gap-1 transition-colors"
                            onClick={(e) => {
                              e.preventDefault()
                              const token = localStorage.getItem('ugcfactory_token')
                              fetch(getContractPdfUrl(sub.contract.id), { headers: { Authorization: `Bearer ${token}` } })
                                .then(r => r.blob())
                                .then(blob => {
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `contrat-${sub.lastName}-${sub.firstName}.pdf`
                                  a.click()
                                  URL.revokeObjectURL(url)
                                })
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            PDF
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
