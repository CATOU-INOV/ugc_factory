// PAGE A1 — Accueil Admin
// Route : /admin

import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCampaigns, deleteCampaign, closeCampaign } from '../../api/campaigns.js'
import { getAnnualBudget, setAnnualBudget } from '../../api/settings.js'
import CampaignModal from '../../components/CampaignModal.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Chargement du tableau de bord">
      <div className="h-9 w-56 bg-gray-200 rounded-lg" />
      <div className="card p-6 h-24 bg-gray-50" />
      <div className="card">
        <div className="p-6 border-b border-gray-100 h-16 bg-gray-50 rounded-t-xl" />
        <div className="p-6 space-y-3">
          {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
        </div>
      </div>
      <div className="card p-6 h-20 bg-gray-50" />
    </div>
  )
}

export default function AdminHome() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editCampaign, setEditCampaign] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [closeTarget, setCloseTarget] = useState(null)
  const [contractSearch, setContractSearch] = useState('')
  const [contractCampaign, setContractCampaign] = useState('')
  const [annualBudget, setAnnualBudgetState] = useState(0)
  const [budgetEditing, setBudgetEditing] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [budgetSaving, setBudgetSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, budgetData] = await Promise.all([getCampaigns(), getAnnualBudget()])
      setCampaigns(data)
      setAnnualBudgetState(budgetData.annualBudget)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleBudgetSave = async () => {
    const val = parseFloat(budgetInput)
    if (isNaN(val) || val < 0) return
    setBudgetSaving(true)
    try {
      const res = await setAnnualBudget(val)
      setAnnualBudgetState(res.annualBudget)
      setBudgetEditing(false)
    } finally {
      setBudgetSaving(false)
    }
  }

  useEffect(() => { load() }, [load])

  const active = campaigns.filter(c => c.isActive)
  const past = campaigns.filter(c => !c.isActive)

  const handleDelete = async () => {
    await deleteCampaign(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const handleClose = async () => {
    await closeCampaign(closeTarget.id)
    setCloseTarget(null)
    load()
  }

  const handleContractSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (contractSearch) params.set('search', contractSearch)
    if (contractCampaign) params.set('campaignId', contractCampaign)
    navigate(`/admin/contrats?${params.toString()}`)
  }

  if (loading) return <DashboardSkeleton />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-black uppercase text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1 text-pretty">Gestion des campagnes UGC Orchestra</p>
      </div>

      {/* ─── Bloc 1 : Nouvelle campagne ─────────────────────────── */}
      <section className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold uppercase text-gray-900 text-lg">Créer une campagne</h2>
            <p className="text-sm text-gray-500 mt-0.5">Maximum 3 campagnes actives simultanément</p>
          </div>
          <button
            onClick={() => { setEditCampaign(null); setModalOpen(true) }}
            className="btn-orchestra shrink-0"
            disabled={active.length >= 3}
            title={active.length >= 3 ? 'Maximum de 3 campagnes actives atteint' : undefined}
          >
            + NOUVELLE CAMPAGNE
          </button>
        </div>
        {active.length >= 3 && (
          <p role="status" className="mt-3 text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
            Le maximum de 3 campagnes simultanées est atteint. Supprimez ou attendez la fin d'une campagne pour en créer une nouvelle.
          </p>
        )}
      </section>

      {/* ─── Bloc 2 : Budget annuel ──────────────────────────────── */}
      {(() => {
        // Prédictif : budget total prévu si toutes les dotations sont envoyées
        const engaged = campaigns.reduce((sum, c) => sum + (c.contentCount ?? 0) * (c.rewardAmount ?? 0), 0)
        // Réel : dotations effectivement envoyées (COMPLETED)
        const spent = campaigns.reduce((sum, c) => sum + (c.completedCount ?? 0) * (c.rewardAmount ?? 0), 0)
        const remaining = annualBudget - engaged
        const pctEngaged = annualBudget > 0 ? Math.min((engaged / annualBudget) * 100, 100) : 0
        const pctSpent = annualBudget > 0 ? Math.min((spent / annualBudget) * 100, 100) : 0
        const overBudget = remaining < 0

        return (
          <section className="card p-6" aria-labelledby="heading-budget">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 id="heading-budget" className="font-display font-bold uppercase text-gray-900 text-lg">
                  Budget annuel
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Estimation si toutes les dotations sont envoyées</p>
              </div>
              {!budgetEditing ? (
                <button
                  onClick={() => { setBudgetInput(String(annualBudget)); setBudgetEditing(true) }}
                  className="text-sm text-orchestra-red hover:text-orchestra-red-dark font-semibold shrink-0"
                >
                  Modifier
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={budgetInput}
                    onChange={e => setBudgetInput(e.target.value)}
                    className="form-input w-28 text-sm"
                    aria-label="Budget annuel en euros"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleBudgetSave(); if (e.key === 'Escape') setBudgetEditing(false) }}
                  />
                  <span className="text-sm text-gray-500">€</span>
                  <button
                    onClick={handleBudgetSave}
                    disabled={budgetSaving}
                    className="text-sm font-semibold text-green-700 hover:text-green-800 disabled:opacity-50"
                  >
                    {budgetSaving ? 'Enregistrement…' : 'Valider'}
                  </button>
                  <button
                    onClick={() => setBudgetEditing(false)}
                    className="text-sm text-gray-400 hover:text-gray-600"
                    aria-label="Annuler"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Budget annuel</p>
                <p className="font-bold text-gray-900 text-lg tabular-nums">{annualBudget.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-amber-700 text-xs uppercase font-semibold mb-1">Engagé</p>
                <p className="font-bold text-lg tabular-nums text-amber-700">
                  {engaged.toLocaleString('fr-FR')} €
                </p>
                <p className="text-xs text-amber-600 mt-0.5">Prévisionnel campagnes</p>
              </div>
              <div className="text-center p-3 bg-orchestra-red-bg rounded-lg">
                <p className="text-orchestra-red-dark text-xs uppercase font-semibold mb-1">Dépensé</p>
                <p className="font-bold text-lg tabular-nums text-orchestra-red-dark">
                  {spent.toLocaleString('fr-FR')} €
                </p>
                <p className="text-xs text-orchestra-red-dark/70 mt-0.5">Rétributions envoyées</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Restant</p>
                <p className={`font-bold text-lg tabular-nums ${overBudget ? 'text-red-600' : 'text-green-700'}`}>
                  {remaining.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>

            {annualBudget > 0 && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(pctEngaged)} aria-valuemin={0} aria-valuemax={100} aria-label={`${Math.round(pctEngaged)}% du budget engagé`}>
                <div className="h-full flex">
                  <div className="h-full bg-orchestra-red transition-all duration-300" style={{ width: `${pctSpent}%` }} />
                  <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${Math.min(pctEngaged - pctSpent, 100 - pctSpent)}%` }} />
                </div>
              </div>
            )}

            {annualBudget > 0 && (engaged > 0 || spent > 0) && (
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orchestra-red inline-block" />Dépensé</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Engagé</span>
              </div>
            )}

            {overBudget && (
              <p role="alert" className="mt-3 text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                Le budget annuel est dépassé de {Math.abs(remaining).toLocaleString('fr-FR')} €.
              </p>
            )}
          </section>
        )
      })()}

      {/* ─── Bloc 3 : Campagnes en cours ────────────────────────── */}
      <section className="card" aria-labelledby="heading-active">
        <div className="p-6 border-b border-gray-100">
          <h2 id="heading-active" className="font-display font-bold uppercase text-gray-900 text-lg">
            Campagnes en cours
            <span className="ml-2 badge bg-orchestra-red-bg text-orchestra-red-dark">{active.length}</span>
          </h2>
        </div>
        {active.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">Aucune campagne en cours.</p>
            <button
              onClick={() => { setEditCampaign(null); setModalOpen(true) }}
              className="mt-3 text-sm font-semibold text-orchestra-red hover:text-orchestra-red-dark transition-colors"
            >
              Créer la première campagne →
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nom de la campagne</th>
                <th scope="col" className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Date limite</th>
                <th scope="col" className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Candidatures</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {active.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/admin/campagne/${c.id}`} className="font-semibold text-gray-900 hover:text-orchestra-red transition-colors">
                        {c.title}
                      </Link>
                      {c.contentCount > 0 && (c.validatedCount ?? 0) + (c.completedCount ?? 0) >= c.contentCount && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Objectif atteint
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 tabular-nums hidden sm:table-cell">{formatDate(c.deadline)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 tabular-nums hidden md:table-cell">{c.submissionsCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        to={`/admin/campagne/${c.id}`}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label={`Consulter la campagne ${c.title}`}
                      >
                        Consulter
                      </Link>
                      <button
                        onClick={() => { setEditCampaign(c); setModalOpen(true) }}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label={`Modifier la campagne ${c.title}`}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => setCloseTarget(c)}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                        aria-label={`Clôturer la campagne ${c.title}`}
                      >
                        Clôturer
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label={`Supprimer la campagne ${c.title}`}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ─── Bloc 3 : Campagnes passées ──────────────────────────── */}
      <section className="card" aria-labelledby="heading-past">
        <div className="p-6 border-b border-gray-100">
          <h2 id="heading-past" className="font-display font-bold uppercase text-gray-900 text-lg">
            Campagnes passées
            <span className="ml-2 badge bg-gray-100 text-gray-600">{past.length}</span>
          </h2>
        </div>
        {past.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">Aucune campagne passée.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nom de la campagne</th>
                <th scope="col" className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Date limite</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {past.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/admin/campagne-passee/${c.id}`} className="font-semibold text-gray-900 hover:text-orchestra-red transition-colors">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 tabular-nums hidden sm:table-cell">{formatDate(c.deadline)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        to={`/admin/campagne-passee/${c.id}`}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label={`Consulter la campagne ${c.title}`}
                      >
                        Consulter
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label={`Supprimer la campagne ${c.title}`}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ─── Bloc 4 : Gestion des contrats ───────────────────────── */}
      <section className="card p-6" aria-labelledby="heading-contracts">
        <h2 id="heading-contracts" className="font-display font-bold uppercase text-gray-900 text-lg mb-4">Gestion des contrats</h2>
        <form onSubmit={handleContractSearch} className="flex flex-col sm:flex-row gap-3" role="search">
          <label htmlFor="contract-search" className="sr-only">Rechercher par nom ou prénom</label>
          <input
            id="contract-search"
            type="text"
            className="form-input flex-1"
            placeholder="Rechercher par nom ou prénom..."
            value={contractSearch}
            onChange={e => setContractSearch(e.target.value)}
          />
          <label htmlFor="contract-campaign" className="sr-only">Filtrer par campagne</label>
          <select
            id="contract-campaign"
            className="form-input sm:w-56"
            value={contractCampaign}
            onChange={e => setContractCampaign(e.target.value)}
          >
            <option value="">Toutes les campagnes</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button type="submit" className="btn-orchestra whitespace-nowrap">
            RECHERCHER
          </button>
        </form>
      </section>

      {/* ─── Bloc 5 : Gestion des utilisateurs ───────────────────── */}
      <section className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold uppercase text-gray-900 text-lg">Gestion des utilisateurs</h2>
            <p className="text-sm text-gray-500 mt-0.5">Comptes administrateurs et médiathèque</p>
          </div>
          <Link to="/admin/utilisateurs" className="btn-secondary shrink-0">
            Gérer les utilisateurs
          </Link>
        </div>
      </section>

      {/* Modal création/édition */}
      <CampaignModal
        isOpen={modalOpen}
        campaign={editCampaign}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />

      {/* Confirmation clôture */}
      <ConfirmDialog
        isOpen={!!closeTarget}
        title="Clôturer la campagne"
        message={`Clôturer la campagne "${closeTarget?.title}" ? Elle sera immédiatement déplacée dans les campagnes passées. Cette action est irréversible.`}
        confirmLabel="Clôturer"
        danger
        onConfirm={handleClose}
        onCancel={() => setCloseTarget(null)}
      />

      {/* Confirmation suppression */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer la campagne"
        message={`Êtes-vous sûr de vouloir supprimer la campagne "${deleteTarget?.title}" ? Cette action est irréversible et supprimera toutes les candidatures associées.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
