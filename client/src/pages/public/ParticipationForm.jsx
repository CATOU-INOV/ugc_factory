// PAGE F2 — Formulaire de participation
// Route : /campagne/:slug/participer
// Mobile-first. Validation vidéo côté client après sélection.

import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useVideoValidation } from '../../hooks/useVideoValidation.js'
import { createSubmission } from '../../api/submissions.js'
import { getCampaignPublic } from '../../api/campaigns.js'
import { useEffect } from 'react'

export default function ParticipationForm() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [campaign, setCampaign] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoValid, setVideoValid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const fileInputRef = useRef()
  const { validate, validating, errors: videoErrors } = useVideoValidation()

  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    getCampaignPublic(slug).then(setCampaign).catch(() => navigate(`/campagne/${slug}`))
  }, [slug, navigate])

  const handleVideoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setVideoFile(file)
    setVideoValid(false)

    const isValid = await validate(file)
    setVideoValid(isValid)
  }

  const onSubmit = async (data) => {
    if (!videoFile || !videoValid) {
      setSubmitError('Veuillez sélectionner et valider une vidéo avant de soumettre.')
      return
    }

    if (!campaign) return

    setSubmitting(true)
    setSubmitError('')
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('campaignId', campaign.id)
      formData.append('firstName', data.firstName.trim())
      formData.append('lastName', data.lastName.trim())
      formData.append('email', data.email.trim())
      formData.append('phone', data.phone.trim())
      formData.append('address', data.address.trim())
      formData.append('video', videoFile)

      await createSubmission(campaign.id, formData, {
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0
          setUploadProgress(pct)
        },
      })
      navigate(`/campagne/${slug}/confirmation`)
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!campaign) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-orchestra-red border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!campaign.isActive) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Cette campagne est terminée.</p>
        <Link to={`/campagne/${slug}`} className="text-orchestra-red mt-4 block">← Retour</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <Link to={`/campagne/${slug}`} className="text-sm text-gray-400 hover:text-orchestra-red flex items-center gap-1 mb-4">
          ← Retour au brief
        </Link>
        <h1 className="text-2xl font-display font-black uppercase text-gray-900">Je participe</h1>
        <p className="text-sm text-gray-500 mt-1">{campaign.title}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ─── Section 1 : Données personnelles ─────────────────── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Mes informations</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Nom *</label>
              <input className="form-input" placeholder="Dupont" {...register('lastName', { required: 'Requis' })} />
              {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="form-label">Prénom *</label>
              <input className="form-input" placeholder="Marie" {...register('firstName', { required: 'Requis' })} />
              {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
          </div>

          <div>
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              placeholder="marie@exemple.fr"
              {...register('email', { required: 'Requis', pattern: { value: /\S+@\S+\.\S+/, message: 'Email invalide' } })}
            />
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="form-label">Téléphone *</label>
            <input
              type="tel"
              className="form-input"
              placeholder="06 12 34 56 78"
              {...register('phone', { required: 'Requis' })}
            />
            {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="form-label">Adresse postale complète *</label>
            <textarea
              className="form-input min-h-[70px] resize-none"
              placeholder="12 rue des Lilas, 75020 Paris"
              {...register('address', { required: 'Requis' })}
            />
            {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address.message}</p>}
          </div>
        </div>

        {/* ─── Section 2 : Dépôt vidéo ──────────────────────────── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Ma vidéo</h2>
          <p className="text-xs text-gray-500">Formats acceptés : MP4, MOV, AVI, WebM, MKV.</p>

          {/* Zone d'upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              videoValid
                ? 'border-green-300 bg-green-50'
                : videoErrors.length > 0
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 hover:border-orchestra-red hover:bg-orchestra-red-bg'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska,video/*"
              className="hidden"
              onChange={handleVideoChange}
            />

            {validating ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-orchestra-red border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600 font-medium">Vérification de la vidéo...</p>
              </div>
            ) : videoFile ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">{videoValid ? '✅' : '❌'}</span>
                <p className="text-sm font-semibold text-gray-900">{videoFile.name}</p>
                <p className="text-xs text-gray-400">({(videoFile.size / 1024 / 1024).toFixed(1)} Mo)</p>
                <p className="text-xs text-gray-500 mt-1">Cliquez pour changer la vidéo</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-semibold text-gray-700">Déposer ma vidéo</p>
                <p className="text-xs text-gray-400">Cliquez pour parcourir</p>
              </div>
            )}
          </div>

          {/* Exigences techniques */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-700">Exigences techniques :</p>
            <div className="space-y-1">
              {[
                { label: 'Résolution minimale : 1080×1920 (format vertical)', met: videoValid },
                { label: 'Durée minimale : 15 secondes', met: videoValid },
                { label: 'Piste audio présente et non silencieuse', met: videoValid },
              ].map((req, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
                    !videoFile ? 'bg-gray-200' : videoValid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {!videoFile ? '·' : videoValid ? '✓' : '✗'}
                  </span>
                  <span className="text-xs text-gray-600">{req.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Erreurs de validation vidéo */}
          {videoErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {videoErrors.map((err, i) => (
                <p key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                  <span className="flex-shrink-0 mt-0.5">⚠️</span>
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* ─── Section 3 : Acceptations ─────────────────────────── */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Acceptations obligatoires</h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 accent-orchestra-red flex-shrink-0"
              {...register('acceptCGU', { required: 'Vous devez accepter les CGU' })}
            />
            <span className="text-sm text-gray-700">
              J'accepte les{' '}
              <a href="#" className="text-orchestra-red underline" onClick={e => { e.preventDefault(); alert('CGU — Texte à intégrer') }}>
                Conditions Générales d'Utilisation
              </a>
              {' '}et la politique de confidentialité d'Orchestra.
            </span>
          </label>
          {errors.acceptCGU && <p className="text-red-600 text-xs pl-7">{errors.acceptCGU.message}</p>}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 accent-orchestra-red flex-shrink-0"
              {...register('acceptBrief', { required: 'Vous devez accepter le brief' })}
            />
            <span className="text-sm text-gray-700">
              Je certifie avoir pris connaissance du brief de la campagne et m'engage à le respecter.
            </span>
          </label>
          {errors.acceptBrief && <p className="text-red-600 text-xs pl-7">{errors.acceptBrief.message}</p>}
        </div>

        {/* Erreur générale */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Bouton submit */}
        <div className="relative">
          <button
            type="submit"
            className="btn-orchestra w-full text-base py-4"
            disabled={submitting || !videoFile || !videoValid}
          >
            {submitting ? `Envoi en cours… ${uploadProgress} %` : 'J\'ENVOIE MA VIDÉO'}
          </button>
          {submitting && (
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                padding: '3px',
                background: `conic-gradient(from -90deg, #e40e20 ${uploadProgress * 3.6}deg, #e5e7eb ${uploadProgress * 3.6}deg)`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'destination-out',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
              }}
            />
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          La sélection n'est pas garantie. Votre participation sera examinée par notre comité.
        </p>
      </form>
    </div>
  )
}
