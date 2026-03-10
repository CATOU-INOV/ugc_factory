// PAGE A6 — Gestion des contrats
// Route : /admin/contrats

import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getContracts, getContractPdfUrl } from '../../api/contracts.js'
import { getCampaigns } from '../../api/campaigns.js'

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

export default function ContractsPage() {
  const [searchParams] = useSearchParams()
  const [contracts, setContracts] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [campaignId, setCampaignId] = useState(searchParams.get('campaignId') || '')

  const loadCampaigns = useCallback(async () => {
    const data = await getCampaigns()
    setCampaigns(data)
  }, [])

  const doSearch = useCallback(async (nameSearch, campId) => {
    setLoading(true)
    try {
      const params = {}
      if (nameSearch?.trim()) params.search = nameSearch.trim()
      if (campId) params.campaignId = campId
      const data = await getContracts(params)
      setContracts(data)
    } finally {
      setLoading(false)
    }
  }, [])

  // Chargement initial : tous les contrats (+ filtres éventuels depuis l'accueil)
  useEffect(() => {
    loadCampaigns()
    doSearch(searchParams.get('search') || '', searchParams.get('campaignId') || '')
  }, []) // eslint-disable-line

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    doSearch(search, campaignId)
  }

  const handleCampaignToggle = (id) => {
    const next = campaignId === id ? '' : id
    setCampaignId(next)
    doSearch(search, next)
  }

  const downloadPDF = (contractId, lastName, firstName) => {
    const token = localStorage.getItem('ugcfactory_token')
    fetch(getContractPdfUrl(contractId), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contrat-${lastName}-${firstName}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => alert('PDF non disponible — le contrat n\'a pas encore été signé'))
  }

  return (
    <div className="space-y-8">
      <nav className="text-sm text-gray-500">
        <Link to="/admin" className="hover:text-orchestra-red transition-colors">Accueil</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Contrats</span>
      </nav>

      <h1 className="text-3xl font-display font-black uppercase text-gray-900">Gestion des contrats</h1>

      {/* Filtres */}
      <div className="card p-6 space-y-4">
        {/* Recherche par nom */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <input
            type="text"
            className="form-input flex-1"
            placeholder="Rechercher par nom ou prénom..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-orchestra whitespace-nowrap">
            Rechercher
          </button>
        </form>

        {/* Filtres par campagne */}
        {campaigns.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filtrer par campagne</p>
            <div className="flex flex-wrap gap-2">
              {campaigns.map(c => {
                const isActive = campaignId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCampaignToggle(c.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                      isActive
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {isActive && (
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {c.title}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Résultats */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-orchestra-red border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="card">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-display font-bold uppercase text-gray-900 text-lg">
              Résultats
              <span className="ml-2 badge bg-gray-100 text-gray-600">{contracts.length}</span>
            </h2>
          </div>

          {contracts.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-sm">Aucun contrat trouvé pour ces critères.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Participant</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Adresse</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Téléphone</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Campagne</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Signé le</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Contrat PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contracts.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 text-sm">{c.submission.firstName} {c.submission.lastName}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{c.submission.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{c.submission.address}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{c.submission.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{c.submission.campaign?.title || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {c.signedAt ? (
                          <span className="text-green-600 font-medium">{formatDate(c.signedAt)}</span>
                        ) : (
                          <span className="text-amber-600">En attente</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {c.pdfPath ? (
                          <button
                            onClick={() => downloadPDF(c.id, c.submission.lastName, c.submission.firstName)}
                            className="text-sm font-medium text-orchestra-red hover:text-orchestra-red-dark flex items-center gap-1 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Télécharger
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Non signé</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
