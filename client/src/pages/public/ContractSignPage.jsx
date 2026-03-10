// PAGE F4 — Signature de contrat (simulée)
// Route : /contrat/:token
// Accessible via lien unique envoyé par "email" (simulé)

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getContractByToken, signContract } from '../../api/contracts.js'

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function ContractSignPage() {
  const { token } = useParams()
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  useEffect(() => {
    getContractByToken(token)
      .then(data => {
        setContract(data)
        if (data.signedAt) setSigned(true)
      })
      .catch(() => setError('Lien invalide ou contrat introuvable. Ce lien a peut-être expiré.'))
      .finally(() => setLoading(false))
  }, [token])

  const handleSign = async () => {
    setSigning(true)
    try {
      await signContract(token)
      setSigned(true)
      const updated = await getContractByToken(token)
      setContract(updated)
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la signature')
    } finally {
      setSigning(false)
    }
  }

  const downloadPDF = async () => {
    const response = await fetch(`/api/contracts/sign/${token}/pdf`)
    if (!response.ok) {
      alert('PDF non encore disponible')
      return
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contrat-orchestra.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Chargement du contrat">
        <div className="h-8 w-3/4 bg-gray-200 rounded-lg" />
        <div className="card p-5 h-32 bg-gray-50" />
        <div className="card p-5 h-48 bg-gray-50" />
        <div className="h-14 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-pretty">{error}</p>
      </div>
    )
  }

  const sub = contract.submission
  const campaign = sub?.campaign

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-display font-black uppercase text-gray-900 text-balance">
          Contrat de cession de droits
        </h1>
        <p className="text-sm text-gray-500 mt-1">Campagne : {campaign?.title}</p>
      </div>

      {/* Récapitulatif participant */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Vos informations</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Nom</p>
            <p className="font-medium text-gray-900 mt-0.5">{sub.lastName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Prénom</p>
            <p className="font-medium text-gray-900 mt-0.5">{sub.firstName}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400 uppercase font-semibold">Email</p>
            <p className="font-medium text-gray-900 mt-0.5">{sub.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Téléphone</p>
            <p className="font-medium text-gray-900 mt-0.5">{sub.phone}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400 uppercase font-semibold">Adresse</p>
            <p className="font-medium text-gray-900 mt-0.5">{sub.address}</p>
          </div>
        </div>
      </div>

      {/* Texte du contrat */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Contrat de cession de droits à l'image et à la vidéo</h2>
        <div
          className="text-sm text-gray-700 space-y-3 max-h-80 overflow-y-auto pr-2"
          role="region"
          aria-label="Texte du contrat — faites défiler pour lire"
          tabIndex={0}
        >
          <p><strong>Entre les soussignés :</strong></p>
          <p>D'une part, la société <strong>Orchestra</strong>, dont le siège social est situé à Montpellier, ci-après dénommée « Orchestra »,</p>
          <p className="text-pretty">Et d'autre part, <strong>{sub.firstName} {sub.lastName}</strong>, demeurant {sub.address}, ci-après dénommé(e) « le Cédant »,</p>

          <p><strong>Article 1 — Objet</strong></p>
          <p className="text-pretty">Le Cédant autorise Orchestra à utiliser, reproduire, représenter, diffuser et exploiter la vidéo soumise dans le cadre de la campagne <em>« {campaign?.title} »</em> sur tout support, en France et à l'international, à des fins promotionnelles et commerciales.</p>

          <p><strong>Article 2 — Étendue de la cession</strong></p>
          <p className="text-pretty">La présente cession de droits porte sur les droits de reproduction, de représentation, d'adaptation, de traduction et d'exploitation du Contenu sous toute forme connue ou inconnue à ce jour, incluant notamment : supports numériques, réseaux sociaux, site web, publicités en ligne et tout autre média de communication.</p>

          <p><strong>Article 3 — Rétribution</strong></p>
          <p>En contrepartie de cette cession, Orchestra s'engage à fournir au Cédant : <strong>{campaign?.reward}</strong>.</p>

          <p><strong>Article 4 — Garanties</strong></p>
          <p className="text-pretty">Le Cédant garantit être l'auteur et le seul titulaire des droits sur le Contenu, et que ce Contenu ne porte pas atteinte aux droits de tiers.</p>

          <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 tabular-nums">
            Document généré le {formatDate(new Date())} — POC UGC Factory Orchestra
          </p>
        </div>
      </div>

      {/* Statut signature */}
      {signed ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg aria-hidden="true" className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-green-800">Contrat signé électroniquement</p>
            {contract.signedAt && (
              <p className="text-sm text-green-600 mt-1 tabular-nums">Le {formatDate(contract.signedAt)}</p>
            )}
          </div>

          {contract.pdfPath && (
            <button
              onClick={downloadPDF}
              className="btn-secondary w-full flex items-center justify-center gap-2"
              aria-label="Télécharger votre contrat signé en PDF"
            >
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              TÉLÉCHARGER LE CONTRAT (PDF)
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 text-center text-pretty">
            En cliquant sur « SIGNER LE CONTRAT », vous acceptez les termes du contrat ci-dessus.
          </p>
          <button
            onClick={handleSign}
            className="btn-orchestra w-full text-base py-4"
            disabled={signing}
            aria-busy={signing}
          >
            {signing ? 'Signature en cours...' : 'SIGNER LE CONTRAT'}
          </button>
        </div>
      )}
    </div>
  )
}
