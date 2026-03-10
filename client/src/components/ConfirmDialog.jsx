// Modale de confirmation générique (suppression, actions irréversibles)
// Accessibilité : focus trap, Escape, role=dialog, aria-modal, aria-labelledby

import { useEffect, useRef } from 'react'

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmer',
  danger = false,
}) {
  const cancelRef = useRef(null)
  const dialogRef = useRef(null)
  const titleId = 'confirm-dialog-title'

  useEffect(() => {
    if (!isOpen) return

    // Focus sur le bouton Annuler à l'ouverture
    const raf = requestAnimationFrame(() => cancelRef.current?.focus())

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel()
        return
      }
      // Focus trap
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />

      {/* Dialogue */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
      >
        {danger && (
          <div className="flex items-center justify-center size-10 rounded-full bg-red-50 mb-4">
            <svg aria-hidden="true" className="size-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
        )}
        <h3 id={titleId} className="text-lg font-bold text-gray-900 font-display uppercase mb-2">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 text-pretty">{message}</p>
        <div className="flex gap-3 justify-end">
          <button ref={cancelRef} onClick={onCancel} className="btn-secondary">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger bg-red-600 text-white hover:bg-red-700' : 'btn-orchestra'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
