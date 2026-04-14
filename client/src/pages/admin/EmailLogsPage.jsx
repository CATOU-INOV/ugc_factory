// Page logs d'emails (simulation)
// Route : /admin/emails

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getEmailLogs } from '../../api/emailLogs.js'

const EMAIL_TYPE_LABELS = {
  INVITATION: 'Invitation',
  REJECTION: 'Refus',
  ACCEPTANCE: 'Acceptation',
  CONTRACT_SENT: 'Contrat envoyé',
  RETRIBUTION_SENT: 'Rétribution envoyée',
}

const EMAIL_TYPE_BADGE = {
  INVITATION: 'bg-blue-50 text-blue-700',
  REJECTION: 'bg-red-50 text-red-700',
  ACCEPTANCE: 'bg-green-50 text-green-700',
  CONTRACT_SENT: 'bg-yellow-50 text-yellow-800',
  RETRIBUTION_SENT: 'bg-emerald-50 text-emerald-700',
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEmailLogs()
      .then(data => { setLogs(data.logs); setLogsTotal(data.total) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <nav className="text-sm text-gray-500">
        <Link to="/admin" className="hover:text-orchestra-red transition-colors">Accueil</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Logs emails</span>
      </nav>

      <div>
        <h1 className="text-3xl font-display font-black uppercase text-gray-900">Logs emails (simulation)</h1>
        <p className="text-gray-500 mt-1 text-sm">Aucun email n'est réellement envoyé. Ces logs tracent les événements qui déclencheraient un envoi en production.</p>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-display font-bold uppercase text-gray-900 text-lg">
            Événements
            <span className="ml-2 badge bg-gray-100 text-gray-600">{logsTotal > logs.length ? `${logs.length}/${logsTotal}` : logs.length}</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-orchestra-red border-t-transparent rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">Aucun log d'email enregistré.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map(log => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`badge ${EMAIL_TYPE_BADGE[log.type] || 'bg-gray-100 text-gray-600'}`}>
                        {EMAIL_TYPE_LABELS[log.type] || log.type}
                      </span>
                      <span className="text-sm text-gray-900 font-medium">{log.recipientEmail}</span>
                    </div>
                    <p className="text-sm text-gray-600">{log.summary}</p>
                    {log.campaign && (
                      <p className="text-xs text-gray-400 mt-1">Campagne : {log.campaign.title}</p>
                    )}
                    {log.submission && (
                      <p className="text-xs text-gray-400">
                        Participant : {log.submission.firstName} {log.submission.lastName}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
