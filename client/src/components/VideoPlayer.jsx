// Lecteur vidéo avec option de téléchargement
// Utilise le streaming de l'API pour la lecture, le download pour le téléchargement

import { getVideoUrl, getVideoDownloadUrl } from '../api/submissions.js'

export default function VideoPlayer({ submissionId, canDownload = false, small = false }) {
  const token = localStorage.getItem('ugcfactory_token')

  return (
    <div className={small ? 'space-y-2' : 'space-y-3'}>
      <video
        controls
        className={`w-full rounded-lg bg-gray-900 ${small ? 'max-h-48' : 'max-h-72'}`}
        src={`${getVideoUrl(submissionId)}?token=${token}`}
        onError={(e) => {
          e.target.style.display = 'none'
        }}
      />
      {canDownload && (
        <a
          href={`${getVideoDownloadUrl(submissionId)}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-orchestra-red hover:text-orchestra-red-dark transition-colors"
          onClick={(e) => {
            // Ajoute le token en header n'est pas possible via <a>, on utilise fetch
            e.preventDefault()
            fetch(`${getVideoDownloadUrl(submissionId)}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(r => r.blob())
              .then(blob => {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `video-${submissionId}.mp4`
                a.click()
                URL.revokeObjectURL(url)
              })
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Télécharger la vidéo
        </a>
      )}
    </div>
  )
}
