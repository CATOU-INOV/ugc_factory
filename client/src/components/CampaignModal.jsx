// Pop-in de création / modification de campagne (PAGE A2)
// Réutilisée en mode création (bouton PUBLIER) et modification (bouton ENREGISTRER)

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  createCampaign, updateCampaign,
  uploadCampaignPhotos, deleteCampaignPhoto, getCampaignPhotoUrl,
} from '../api/campaigns.js'

const EMPTY_PRODUCT = { name: '', reference: '' }
const MAX_PHOTOS = 5

export default function CampaignModal({ isOpen, campaign, onClose, onSaved }) {
  const isEdit = !!campaign
  const [products, setProducts] = useState([])
  const [photos, setPhotos] = useState([])          // photos déjà uploadées (mode édition)
  const [pendingFiles, setPendingFiles] = useState([]) // File[] en attente (mode création)
  const [pendingPreviews, setPendingPreviews] = useState([]) // URL.createObjectURL correspondants
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  // Sync les previews avec les fichiers en attente
  useEffect(() => {
    const urls = pendingFiles.map(f => URL.createObjectURL(f))
    setPendingPreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [pendingFiles])

  useEffect(() => {
    if (isOpen) {
      if (campaign) {
        const deadline = campaign.deadline
          ? new Date(campaign.deadline).toISOString().slice(0, 10)
          : ''
        reset({
          title: campaign.title,
          deadline,
          wordings: campaign.wordings || '',
          elementsToShow: campaign.elementsToShow,
          childrenAllowed: campaign.childrenAllowed,
          reward: campaign.reward,
          contentCount: campaign.contentCount ?? '',
          rewardAmount: campaign.rewardAmount ?? '',
        })
        setProducts(Array.isArray(campaign.products) && campaign.products.length > 0
          ? campaign.products
          : [])
        setPhotos(campaign.photos || [])
      } else {
        reset({ title: '', deadline: '', wordings: '', elementsToShow: '', childrenAllowed: false, reward: '', contentCount: '', rewardAmount: '' })
        setProducts([])
        setPhotos([])
      }
      setPendingFiles([])
    }
  }, [isOpen, campaign, reset])

  // ── Gestion de la liste produits ──────────────────────────────────
  const addProduct = () => setProducts(prev => [...prev, { ...EMPTY_PRODUCT }])
  const removeProduct = (index) => setProducts(prev => prev.filter((_, i) => i !== index))
  const updateProduct = (index, field, value) =>
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))

  // ── Gestion des photos ────────────────────────────────────────────
  const totalPhotos = photos.length + pendingFiles.length

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return

    const remaining = MAX_PHOTOS - totalPhotos
    if (remaining <= 0) return
    const toProcess = files.slice(0, remaining)

    if (isEdit) {
      setPhotoUploading(true)
      try {
        const created = await uploadCampaignPhotos(campaign.id, toProcess)
        setPhotos(prev => [...prev, ...created])
      } catch (err) {
        alert(err.response?.data?.error || 'Erreur lors de l\'upload')
      } finally {
        setPhotoUploading(false)
      }
    } else {
      setPendingFiles(prev => [...prev, ...toProcess])
    }
  }

  const handleDeleteExistingPhoto = async (photoId) => {
    try {
      await deleteCampaignPhoto(campaign.id, photoId)
      setPhotos(prev => prev.filter(p => p.id !== photoId))
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const removePendingFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  // ── Soumission ────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      const validProducts = products.filter(p => p.name.trim() || p.reference.trim())
      const payload = {
        ...data,
        childrenAllowed: Boolean(data.childrenAllowed),
        products: validProducts,
        contentCount: data.contentCount ? parseInt(data.contentCount, 10) : null,
        rewardAmount: data.rewardAmount ? parseFloat(data.rewardAmount) : null,
      }
      if (isEdit) {
        await updateCampaign(campaign.id, payload)
      } else {
        const created = await createCampaign(payload)
        if (pendingFiles.length > 0) {
          await uploadCampaignPhotos(created.id, pendingFiles)
        }
      }
      onSaved()
      onClose()
    } catch (err) {
      alert(err.response?.data?.error || 'Une erreur est survenue')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay — fixed pour couvrir toute la hauteur de page */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Conteneur centré */}
      <div className="flex min-h-full items-center justify-center p-4">
      {/* Modale */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-display font-bold uppercase text-gray-900">
            {isEdit ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Titre */}
          <div>
            <label className="form-label">Titre de la campagne *</label>
            <input
              className="form-input"
              placeholder="Ex : Rentrée Scolaire 2025"
              {...register('title', { required: 'Le titre est obligatoire' })}
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* Date limite */}
          <div>
            <label className="form-label">Date limite de dépôt *</label>
            <input
              type="date"
              className="form-input"
              {...register('deadline', { required: 'La date limite est obligatoire' })}
            />
            {errors.deadline && <p className="text-red-600 text-sm mt-1">{errors.deadline.message}</p>}
          </div>

          {/* ── Produits associés ──────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Produits associés</label>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-1.5 text-sm font-semibold text-orchestra-red hover:text-orchestra-red-dark transition-colors"
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un produit
              </button>
            </div>

            {products.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">Aucun produit associé à cette campagne.</p>
            ) : (
              <div className="space-y-2">
                {products.map((product, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input
                      className="form-input flex-1"
                      placeholder="Nom du produit (ex : Poussette Trio Athéna)"
                      value={product.name}
                      onChange={e => updateProduct(index, 'name', e.target.value)}
                    />
                    <input
                      className="form-input w-44"
                      placeholder="Référence (ex : PPS57Z-CCC)"
                      value={product.reference}
                      onChange={e => updateProduct(index, 'reference', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="mt-0.5 p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      aria-label="Supprimer ce produit"
                    >
                      <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wordings */}
          <div>
            <label className="form-label">Wordings suggérés</label>
            <textarea
              className="form-input min-h-[80px] resize-y"
              placeholder="Exemples de phrases que les participants peuvent utiliser..."
              {...register('wordings')}
            />
          </div>

          {/* Éléments à montrer */}
          <div>
            <label className="form-label">Éléments à montrer / ne pas montrer *</label>
            <textarea
              className="form-input min-h-[100px] resize-y"
              placeholder="Ex : Montrez les vêtements Orchestra, l'ambiance familiale. Ne pas montrer : logos concurrents..."
              {...register('elementsToShow', { required: 'Ce champ est obligatoire' })}
            />
            {errors.elementsToShow && <p className="text-red-600 text-sm mt-1">{errors.elementsToShow.message}</p>}
          </div>

          {/* Visibilité enfant */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="childrenAllowed"
              className="w-4 h-4 accent-orchestra-red"
              {...register('childrenAllowed')}
            />
            <label htmlFor="childrenAllowed" className="text-sm font-medium text-gray-700 cursor-pointer">
              Présence d'enfants autorisée dans la vidéo
            </label>
          </div>

          {/* Rétribution */}
          <div>
            <label className="form-label">Lot / Rétribution *</label>
            <input
              className="form-input"
              placeholder="Ex : Bon d'achat Orchestra de 50€"
              {...register('reward', { required: 'La rétribution est obligatoire' })}
            />
            {errors.reward && <p className="text-red-600 text-sm mt-1">{errors.reward.message}</p>}
          </div>

          {/* ── Budget dotation ──────────────────────────────────────── */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <p className="text-sm font-semibold text-gray-700">Budget dotation</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="contentCount" className="form-label">Contenus à valider</label>
                <input
                  id="contentCount"
                  type="number"
                  min="1"
                  step="1"
                  className="form-input"
                  placeholder="Ex : 10"
                  {...register('contentCount', {
                    min: { value: 1, message: 'Minimum 1' },
                    validate: v => !v || Number.isInteger(Number(v)) || 'Nombre entier requis',
                  })}
                />
                {errors.contentCount && <p className="text-red-600 text-xs mt-1">{errors.contentCount.message}</p>}
              </div>
              <div>
                <label htmlFor="rewardAmount" className="form-label">Valeur / créateur (€)</label>
                <input
                  id="rewardAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="Ex : 50"
                  {...register('rewardAmount', {
                    min: { value: 0, message: 'Minimum 0' },
                  })}
                />
                {errors.rewardAmount && <p className="text-red-600 text-xs mt-1">{errors.rewardAmount.message}</p>}
              </div>
            </div>
            {(() => {
              const cc = parseFloat(watch('contentCount'))
              const ra = parseFloat(watch('rewardAmount'))
              if (cc > 0 && ra >= 0 && !isNaN(cc) && !isNaN(ra)) {
                return (
                  <p className="text-sm text-gray-600">
                    Budget campagne :{' '}
                    <span className="font-semibold text-gray-900">{(cc * ra).toLocaleString('fr-FR')} €</span>
                  </p>
                )
              }
              return null
            })()}
          </div>

          {/* ── Photos de référence ──────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Photos de référence</label>
              <span className="text-xs text-gray-400 tabular-nums" aria-live="polite">
                {totalPhotos} / {MAX_PHOTOS}
              </span>
            </div>

            {/* Grille des photos */}
            {(photos.length > 0 || pendingFiles.length > 0) && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {/* Photos existantes (mode édition) */}
                {photos.map(photo => (
                  <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img
                      src={getCampaignPhotoUrl(campaign.id, photo.id)}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingPhoto(photo.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label="Supprimer cette photo"
                    >
                      <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Fichiers en attente (mode création) */}
                {pendingPreviews.map((preview, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img
                      src={preview}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-end p-1">
                      <span className="text-[10px] text-white/80 truncate leading-tight">À enregistrer</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePendingFile(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label="Retirer cette photo"
                    >
                      <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton d'ajout */}
            {totalPhotos < MAX_PHOTOS && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleFileSelect}
                  tabIndex={-1}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orchestra-red"
                >
                  {photoUploading ? (
                    'Upload en cours...'
                  ) : (
                    <>
                      <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Ajouter des photos
                      <span className="text-gray-400 tabular-nums">
                        ({MAX_PHOTOS - totalPhotos} emplacement{MAX_PHOTOS - totalPhotos > 1 ? 's' : ''} restant{MAX_PHOTOS - totalPhotos > 1 ? 's' : ''})
                      </span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Annuler
            </button>
            <button type="submit" className="btn-orchestra" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : isEdit ? 'ENREGISTRER' : 'PUBLIER'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  )
}
