// PAGE A3 — Campagne en cours (détail Admin)
// Route : /admin/campagne/:id

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCampaignById } from '../../api/campaigns.js'
import { getSubmissions, updateSubmissionStatus, getVideoUrl } from '../../api/submissions.js'
import StatusBadge, { STATUS_CONFIG } from '../../components/StatusBadge.jsx'
import VideoPlayer from '../../components/VideoPlayer.jsx'
import CampaignModal from '../../components/CampaignModal.jsx'
import PhotoGallery from '../../components/PhotoGallery.jsx'

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// Étapes du workflow dans l'ordre (chemin normal, hors REJECTED)
const WORKFLOW_STEPS = [
  { status: 'PENDING',               label: 'Reçue' },
  { status: 'VIDEO_VIEWED',          label: 'Vidéo vue' },
  { status: 'VALIDATED_NO_CONTRACT', label: 'Contrat envoyé' },
  { status: 'VALIDATED',             label: 'Contrat signé' },
  { status: 'COMPLETED',             label: 'Terminée' },
]

const STEP_INDEX = Object.fromEntries(WORKFLOW_STEPS.map((s, i) => [s.status, i]))

function StatusStepper({ status }) {
  const isRejected = status === 'REJECTED'
  // Pour REJECTED, l'étape "active" avant refus est VIDEO_VIEWED
  const currentIndex = isRejected ? STEP_INDEX['VIDEO_VIEWED'] : (STEP_INDEX[status] ?? 0)

  return (
    <div className="flex items-center gap-0 w-full" aria-label="Progression de la candidature">
      {WORKFLOW_STEPS.map((step, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex && !isRejected
        const isFuture = i > currentIndex || (isRejected && i > currentIndex)

        return (
          <div key={step.status} className="flex items-center flex-1 min-w-0">
            {/* Nœud */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                isDone    ? 'bg-orchestra-red border-orchestra-red' :
                isCurrent ? 'bg-white border-orchestra-red' :
                            'bg-white border-gray-200'
              }`}>
                {isDone && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isCurrent && <span className="w-2 h-2 rounded-full bg-orchestra-red" aria-hidden="true" />}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight max-w-[52px] ${
                isDone    ? 'text-orchestra-red font-medium' :
                isCurrent ? 'text-orchestra-red font-semibold' :
                            'text-gray-300'
              }`}>
                {step.label}
              </span>
            </div>

            {/* Connecteur (sauf après le dernier) */}
            {i < WORKFLOW_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 transition-colors ${isDone ? 'bg-orchestra-red' : 'bg-gray-200'}`} aria-hidden="true" />
            )}
          </div>
        )
      })}

      {/* Branche REJECTED */}
      {isRejected && (
        <div className="flex flex-col items-center shrink-0 ml-2">
          <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-red-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="text-[10px] mt-1 text-red-500 font-semibold text-center leading-tight max-w-[52px]">Refusée</span>
        </div>
      )}
    </div>
  )
}

const NEXT_STATUSES = {
  PENDING: ['VIDEO_VIEWED'],
  VIDEO_VIEWED: ['REJECTED', 'VALIDATED_NO_CONTRACT'],
  REJECTED: ['VALIDATED_NO_CONTRACT'], // réouverture possible avant deadline
  VALIDATED_NO_CONTRACT: [],
  VALIDATED: ['COMPLETED'],
  COMPLETED: [],
}

const STATUS_LABELS = {
  VIDEO_VIEWED: 'Marquer comme vue',
  REJECTED: 'Refuser',
  VALIDATED_NO_CONTRACT: 'Valider (envoyer contrat)',
  COMPLETED: 'Marquer terminée (rétribution envoyée)',
}

function VideoModal({ submissionId, onClose }) {
  const token = localStorage.getItem('ugcfactory_token')
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
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

function VideoCard({ sub, campaign, onPlay, onStatusChange, statusLoading }) {
  const token = localStorage.getItem('ugcfactory_token')
  const isDeadlinePassed = new Date(campaign.deadline) < new Date()
  const actions = (NEXT_STATUSES[sub.status] || []).filter(() =>
    !(sub.status === 'REJECTED' && isDeadlinePassed)
  )

  return (
    <article className="card overflow-hidden">
      {/* Vignette vidéo */}
      <button
        className="relative w-full aspect-video bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orchestra-red focus-visible:ring-inset group"
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
        <div className="absolute top-2 right-2">
          <StatusBadge status={sub.status} />
        </div>
      </button>

      {/* Infos + actions */}
      <div className="p-3 space-y-3">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{sub.firstName} {sub.lastName}</p>
          <p className="text-xs text-gray-400 tabular-nums">{formatDate(sub.createdAt)}</p>
        </div>

        <StatusStepper status={sub.status} />

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
            {actions.map(nextStatus => (
              <button
                key={nextStatus}
                onClick={() => onStatusChange(sub.id, nextStatus)}
                disabled={statusLoading[sub.id]}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  nextStatus === 'REJECTED'
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : nextStatus === 'VALIDATED_NO_CONTRACT'
                    ? 'border-green-200 text-green-700 hover:bg-green-50'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {statusLoading[sub.id] ? '...' : STATUS_LABELS[nextStatus]}
              </button>
            ))}
          </div>
        )}

        {sub.contract && sub.status === 'VALIDATED_NO_CONTRACT' && (
          <p className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100">
            Contrat envoyé — en attente de signature
          </p>
        )}
      </div>
    </article>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Chargement de la campagne">
      <div className="h-4 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 h-64 bg-gray-50" />
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 w-40 bg-gray-200 rounded" />
          {[1, 2, 3].map(i => <div key={i} className="card h-36 bg-gray-50" />)}
        </div>
      </div>
    </div>
  )
}

export default function CampaignActivePage() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [statusLoading, setStatusLoading] = useState({})
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('list')
  const [playingVideo, setPlayingVideo] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [camp, subs] = await Promise.all([
        getCampaignById(id),
        getSubmissions(id),
      ])
      setCampaign(camp)
      setSubmissions(subs)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (submissionId, newStatus) => {
    setStatusLoading(prev => ({ ...prev, [submissionId]: true }))
    try {
      await updateSubmissionStatus(submissionId, newStatus)
      await load()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du changement de statut')
    } finally {
      setStatusLoading(prev => ({ ...prev, [submissionId]: false }))
    }
  }

  const filtered = statusFilter === 'ALL' ? submissions : submissions.filter(s => s.status === statusFilter)
  const sorted = [...filtered].sort((a, b) =>
    sortOrder === 'desc'
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : new Date(a.createdAt) - new Date(b.createdAt)
  )

  if (loading) return <PageSkeleton />
  if (!campaign) return <p className="text-gray-500">Campagne introuvable.</p>

  const validatedTotal = submissions.filter(s =>
    s.status === 'VALIDATED_NO_CONTRACT' || s.status === 'VALIDATED' || s.status === 'COMPLETED'
  ).length
  const quotaReached = campaign.contentCount > 0 && validatedTotal >= campaign.contentCount

  return (
    <div className="space-y-6">
      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="text-sm text-gray-500">
        <Link to="/admin" className="hover:text-orchestra-red transition-colors">Accueil</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-gray-900 font-medium">{campaign.title}</span>
      </nav>

      {/* Notification objectif atteint */}
      {quotaReached && (
        <div className="flex items-start gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800" role="status">
          <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-semibold">Objectif atteint —</span>{' '}
            {validatedTotal} candidature{validatedTotal > 1 ? 's' : ''} validée{validatedTotal > 1 ? 's' : ''} sur {campaign.contentCount} prévues.
            Vous pouvez clôturer la campagne.
          </div>
        </div>
      )}

      {/* Layout 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Bloc gauche : Brief ───────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="card p-6 space-y-4 sticky top-24">
            <div className="flex items-start justify-between">
              <h2 className="font-display font-bold uppercase text-gray-900">Brief campagne</h2>
              <button
                onClick={() => setModalOpen(true)}
                className="text-xs text-orchestra-red hover:text-orchestra-red-dark font-semibold"
                aria-label="Modifier le brief de cette campagne"
              >
                Modifier
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Titre</p>
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
              {Array.isArray(campaign.products) && campaign.products.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700">Produits associés</p>
                  <ul className="mt-1 space-y-1">
                    {campaign.products.map((p, i) => (
                      <li key={i} className="flex items-baseline gap-2">
                        <span className="text-gray-600">{p.name}</span>
                        {p.reference && (
                          <a
                            href={`https://fr.shop-orchestra.com/fr/search?q=${encodeURIComponent(p.reference)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-gray-100 text-orchestra-red hover:text-orchestra-red-dark hover:bg-red-50 px-1.5 py-0.5 rounded font-mono transition-colors"
                          >{p.reference}</a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-700">Enfants autorisés</p>
                <p className="text-gray-600">{campaign.childrenAllowed ? 'Oui' : 'Non'}</p>
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

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Lien public :{' '}
                <a
                  href={`/campagne/${campaign.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-orchestra-red hover:underline"
                  aria-label={`Voir la page publique de la campagne ${campaign.title}`}
                >
                  /campagne/{campaign.slug}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* ─── Bloc droit : Candidatures ───────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-bold uppercase text-gray-900">
              <span className="text-gray-400 font-normal mr-1 tabular-nums">
                {filtered.length !== submissions.length ? `${filtered.length}/${submissions.length}` : submissions.length}
              </span>
              Candidatures
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1.5"
                aria-label={`Trier par date — actuellement ${sortOrder === 'desc' ? 'plus récentes en premier' : 'plus anciennes en premier'}`}
              >
                {sortOrder === 'desc' ? 'Plus récentes' : 'Plus anciennes'}
                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
              {/* Toggle vue liste / grille */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  aria-label="Vue liste" aria-pressed={viewMode === 'list'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  aria-label="Vue grille" aria-pressed={viewMode === 'grid'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Filtres par statut */}
          {submissions.length > 0 && (() => {
            const filters = [
              { value: 'ALL', label: 'Tous' },
              { value: 'PENDING', label: 'En attente' },
              { value: 'VIDEO_VIEWED', label: 'Vidéo vue' },
              { value: 'REJECTED', label: 'Refusées' },
              { value: 'VALIDATED_NO_CONTRACT', label: 'Contrat envoyé' },
              { value: 'VALIDATED', label: 'Contrat signé' },
              { value: 'COMPLETED', label: 'Terminées' },
            ].filter(f => f.value === 'ALL' || submissions.some(s => s.status === f.value))

            return (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par statut">
                {filters.map(f => {
                  const count = f.value === 'ALL' ? submissions.length : submissions.filter(s => s.status === f.value).length
                  return (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value)}
                      aria-pressed={statusFilter === f.value}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                        statusFilter === f.value
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {f.label} <span className={`ml-0.5 tabular-nums ${statusFilter === f.value ? 'text-white/70' : 'text-gray-400'}`}>{count}</span>
                    </button>
                  )
                })}
              </div>
            )
          })()}
          </div>

          {sorted.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-gray-400 text-sm">Aucune candidature pour cette campagne.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sorted.map(sub => (
                <VideoCard
                  key={sub.id}
                  sub={sub}
                  campaign={campaign}
                  onPlay={() => setPlayingVideo(sub.id)}
                  onStatusChange={handleStatusChange}
                  statusLoading={statusLoading}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map(sub => (
                <article key={sub.id} className="card p-5">
                  {/* En-tête candidature */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">
                        {sub.firstName} {sub.lastName}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{sub.email} · {sub.phone}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{sub.address}</p>
                      <p className="text-xs text-gray-400 mt-1 tabular-nums">
                        Déposé le {formatDate(sub.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  {/* Progression */}
                  <div className="pt-3 pb-2 border-t border-gray-50">
                    <StatusStepper status={sub.status} />
                  </div>

                  {/* Vidéo */}
                  <div className="mb-3 pt-3 border-t border-gray-50">
                    {selectedVideo === sub.id ? (
                      <div>
                        <VideoPlayer submissionId={sub.id} canDownload={true} />
                        <button
                          onClick={() => setSelectedVideo(null)}
                          className="text-xs text-gray-400 mt-2 hover:text-gray-600 transition-colors"
                        >
                          Fermer la vidéo
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedVideo(sub.id)}
                        className="flex items-center gap-2 text-sm font-medium text-orchestra-red hover:text-orchestra-red-dark transition-colors"
                        aria-label={`Lire la vidéo de ${sub.firstName} ${sub.lastName}`}
                      >
                        <svg aria-hidden="true" className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
                        </svg>
                        Lire / télécharger la vidéo
                      </button>
                    )}
                  </div>

                  {/* Actions de statut */}
                  {(() => {
                    const isDeadlinePassed = new Date(campaign.deadline) < new Date()
                    const actions = (NEXT_STATUSES[sub.status] || []).filter(s =>
                      !(sub.status === 'REJECTED' && isDeadlinePassed)
                    )
                    return actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      {actions.map(nextStatus => (
                        <button
                          key={nextStatus}
                          onClick={() => handleStatusChange(sub.id, nextStatus)}
                          disabled={statusLoading[sub.id]}
                          aria-label={`${STATUS_LABELS[nextStatus]} — ${sub.firstName} ${sub.lastName}`}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            nextStatus === 'REJECTED'
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : nextStatus === 'VALIDATED_NO_CONTRACT'
                              ? 'border-green-200 text-green-700 hover:bg-green-50'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {statusLoading[sub.id] ? '...' : STATUS_LABELS[nextStatus]}
                        </button>
                      ))}
                    </div>
                  )
                  })()}

                  {/* Contrat en attente de signature */}
                  {sub.contract && sub.status === 'VALIDATED_NO_CONTRACT' && (
                    <div className="mt-3 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                      Contrat envoyé — en attente de signature du participant
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal vidéo plein écran (vue grille) */}
      {playingVideo && (
        <VideoModal submissionId={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}

      {/* Modal édition brief */}
      <CampaignModal
        isOpen={modalOpen}
        campaign={campaign}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  )
}
