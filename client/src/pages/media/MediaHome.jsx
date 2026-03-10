// PAGE M1 — Accueil Média
// Route : /media

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCampaigns } from '../../api/campaigns.js'

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function MediaHome() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCampaigns().then(setCampaigns).finally(() => setLoading(false))
  }, [])

  const active = campaigns.filter(c => c.isActive)
  const past = campaigns.filter(c => !c.isActive)

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-orchestra-red border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-black uppercase text-gray-900">Médiathèque</h1>
        <p className="text-gray-500 mt-1">Consultation des contenus UGC Orchestra</p>
      </div>

      {/* Campagnes en cours */}
      <section className="card">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-display font-bold uppercase text-gray-900 text-lg">
            Campagnes en cours
            <span className="ml-2 badge bg-orchestra-red-bg text-orchestra-red-dark">{active.length}</span>
          </h2>
        </div>
        {active.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">Aucune campagne en cours.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {active.map(c => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <Link
                    to={`/media/campagne/${c.id}`}
                    className="font-semibold text-gray-900 hover:text-orchestra-red transition-colors"
                  >
                    {c.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-0.5">Limite : {formatDate(c.deadline)} · {c.submissionsCount} candidature(s)</p>
                </div>
                <Link to={`/media/campagne/${c.id}`} className="text-sm text-orchestra-red hover:text-orchestra-red-dark font-medium">
                  Voir →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Campagnes passées */}
      <section className="card">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-display font-bold uppercase text-gray-900 text-lg">
            Campagnes passées
            <span className="ml-2 badge bg-gray-100 text-gray-600">{past.length}</span>
          </h2>
        </div>
        {past.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">Aucune campagne passée.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {past.map(c => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <Link
                    to={`/media/campagne-passee/${c.id}`}
                    className="font-semibold text-gray-900 hover:text-orchestra-red transition-colors"
                  >
                    {c.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-0.5">Terminée le {formatDate(c.deadline)}</p>
                </div>
                <Link to={`/media/campagne-passee/${c.id}`} className="text-sm text-orchestra-red hover:text-orchestra-red-dark font-medium">
                  Voir →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
