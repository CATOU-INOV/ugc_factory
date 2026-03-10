// Composant réutilisable — Galerie de photos de brief
// Grille responsive + lightbox plein écran avec navigation clavier

import { useState, useEffect, useRef } from 'react'
import { getCampaignPhotoUrl } from '../api/campaigns.js'

function PhotoLightbox({ photos, initialIndex, campaignId, onClose }) {
  const [index, setIndex] = useState(initialIndex)
  const closeRef = useRef(null)
  const dialogRef = useRef(null)

  const prev = () => setIndex(i => (i - 1 + photos.length) % photos.length)
  const next = () => setIndex(i => (i + 1) % photos.length)

  useEffect(() => {
    closeRef.current?.focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowLeft') { prev(); return }
      if (e.key === 'ArrowRight') { next(); return }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const photo = photos[index]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Photo ${index + 1} sur ${photos.length}`}
        className="relative flex items-center gap-4 max-w-5xl w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Fermer */}
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white font-semibold flex items-center gap-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
          aria-label="Fermer la galerie"
        >
          Fermer
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Précédent */}
        {photos.length > 1 && (
          <button
            onClick={prev}
            className="shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Photo précédente"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Image */}
        <div className="flex-1 flex items-center justify-center">
          <img
            key={photo.id}
            src={getCampaignPhotoUrl(campaignId, photo.id)}
            alt={`Photo de brief ${index + 1}`}
            className="max-h-[80vh] max-w-full rounded-lg object-contain"
          />
        </div>

        {/* Suivant */}
        {photos.length > 1 && (
          <button
            onClick={next}
            className="shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Photo suivante"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Compteur */}
        {photos.length > 1 && (
          <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums">
            {index + 1} / {photos.length}
          </p>
        )}
      </div>
    </div>
  )
}

export default function PhotoGallery({ photos, campaignId }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (!photos || photos.length === 0) return null

  return (
    <>
      <div
        className={`grid gap-2 ${
          photos.length === 1
            ? 'grid-cols-1'
            : photos.length === 2
            ? 'grid-cols-2'
            : 'grid-cols-2 sm:grid-cols-3'
        }`}
        role="list"
        aria-label={`${photos.length} photo${photos.length > 1 ? 's' : ''} de brief`}
      >
        {photos.map((photo, i) => (
          <div key={photo.id} role="listitem">
            <button
              className="w-full aspect-square overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orchestra-red focus-visible:ring-offset-1 group"
              onClick={() => setLightboxIndex(i)}
              aria-label={`Agrandir la photo ${i + 1}`}
            >
              <img
                src={getCampaignPhotoUrl(campaignId, photo.id)}
                alt={`Photo de brief ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </button>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          campaignId={campaignId}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
