// Badge de statut de candidature

const STATUS_CONFIG = {
  PENDING:                { label: 'En attente',         dot: 'bg-gray-400',    className: 'bg-gray-100 text-gray-600' },
  VIDEO_VIEWED:           { label: 'Vidéo vue',           dot: 'bg-blue-500',    className: 'bg-blue-50 text-blue-700' },
  REJECTED:               { label: 'Refusée',             dot: 'bg-red-500',     className: 'bg-red-50 text-red-700' },
  VALIDATED_NO_CONTRACT:  { label: 'Signature en attente', dot: 'bg-amber-500',  className: 'bg-amber-50 text-amber-700' },
  VALIDATED:              { label: 'Validée',             dot: 'bg-green-500',   className: 'bg-green-50 text-green-700' },
  COMPLETED:              { label: 'Terminée',            dot: 'bg-emerald-500', className: 'bg-emerald-50 text-emerald-700' },
}

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, dot: 'bg-gray-400', className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
