// PAGE F3 — Confirmation de dépôt
// Route : /campagne/:slug/confirmation

export default function ConfirmationPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
      {/* Icône succès */}
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <svg aria-hidden="true" className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Message principal */}
      <div>
        <h1 className="text-2xl font-display font-black uppercase text-gray-900 text-balance">
          Merci pour votre participation !
        </h1>
        <p className="text-gray-600 mt-3 text-pretty">
          Votre vidéo a bien été reçue et enregistrée dans notre système.
        </p>
      </div>

      {/* Information sur le processus */}
      <div className="bg-gray-50 rounded-xl p-5 text-left w-full max-w-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Et ensuite ?</h2>
        <ol className="space-y-2 text-sm text-gray-600 list-none">
          <li className="flex items-start gap-2">
            <span className="text-orchestra-red mt-0.5 font-bold tabular-nums shrink-0">1.</span>
            <p className="text-pretty">Notre comité examine votre vidéo sous 10 à 15 jours.</p>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orchestra-red mt-0.5 font-bold tabular-nums shrink-0">2.</span>
            <p className="text-pretty">Si votre vidéo est sélectionnée, vous recevrez un email avec un lien pour signer votre contrat de cession de droits.</p>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orchestra-red mt-0.5 font-bold tabular-nums shrink-0">3.</span>
            <p className="text-pretty">Après signature, votre rétribution vous sera envoyée.</p>
          </li>
        </ol>
      </div>

      {/* Avertissement sélection */}
      <div className="max-w-xs space-y-2 text-center">
        <p className="text-sm text-gray-400 flex items-start gap-1.5 text-pretty">
          <svg aria-hidden="true" className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          La sélection n'est pas garantie. Seules les vidéos correspondant au brief de la campagne seront retenues.
        </p>
        <p className="text-xs text-gray-400 text-pretty">
          Conformément à nos CGU, si votre vidéo n'est pas sélectionnée, vos données personnelles et votre vidéo seront supprimées de nos systèmes.
        </p>
      </div>
    </div>
  )
}
