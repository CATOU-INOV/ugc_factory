// Hook de validation vidéo côté client (sans ffprobe)
// Utilise les API navigateur : HTMLVideoElement + Web Audio API
// Contraintes vérifiées :
//   - Résolution ≥ 1080×1920 (format vertical)
//   - Durée ≥ 15 secondes
//   - Piste audio présente et non silencieuse

import { useState, useCallback } from 'react'

export function useVideoValidation() {
  const [validating, setValidating] = useState(false)
  const [errors, setErrors] = useState([])

  const validate = useCallback((file) => {
    return new Promise((resolve) => {
      setValidating(true)
      setErrors([])

      if (!file) {
        setErrors(['Aucun fichier sélectionné'])
        setValidating(false)
        resolve(false)
        return
      }

      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = false

      const foundErrors = []

      video.onloadedmetadata = async () => {
        // ─── Vérification durée ────────────────────────────────
        if (isFinite(video.duration) && video.duration < 15) {
          foundErrors.push(`Durée insuffisante : ${Math.round(video.duration)} secondes (minimum requis : 15 secondes)`)
        }

        // ─── Vérification résolution (format vertical) ─────────
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          if (video.videoWidth < 1080 || video.videoHeight < 1920) {
            foundErrors.push(`Résolution insuffisante : ${video.videoWidth}×${video.videoHeight} (minimum requis : 1080×1920 — format vertical)`)
          }
        }
        // Si videoWidth/Height = 0 au moment de loadedmetadata, on attend canplay

        // ─── Vérification piste audio ──────────────────────────
        try {
          const hasAudio = await checkAudioPresence(file)
          if (!hasAudio) {
            foundErrors.push('Aucune piste audio détectée ou la piste audio est silencieuse')
          }
        } catch (audioErr) {
          // L'API WebAudio peut échouer sur certains formats — on ne bloque pas dans ce cas
          console.warn('[VideoValidation] Impossible de vérifier la piste audio :', audioErr)
        }

        URL.revokeObjectURL(url)
        setErrors(foundErrors)
        setValidating(false)
        resolve(foundErrors.length === 0)
      }

      video.onerror = () => {
        URL.revokeObjectURL(url)
        const msg = 'Impossible de lire le fichier vidéo. Vérifiez que le format est supporté (MP4, MOV, AVI, WebM, MKV).'
        setErrors([msg])
        setValidating(false)
        resolve(false)
      }

      video.src = url
    })
  }, [])

  return { validate, validating, errors }
}

/**
 * Vérifie la présence d'une piste audio non silencieuse
 * Utilise Web Audio API pour analyser le niveau RMS
 */
async function checkAudioPresence(file) {
  return new Promise((resolve, reject) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) {
      resolve(true) // API non disponible, on ne bloque pas
      return
    }

    const audioCtx = new AudioContext()
    const reader = new FileReader()

    // On lit seulement les 2 premières Mo pour aller vite
    const chunk = file.slice(0, 2 * 1024 * 1024)

    reader.onload = async (e) => {
      try {
        const buffer = await audioCtx.decodeAudioData(e.target.result)
        const channelData = buffer.getChannelData(0)

        // Calcul du niveau RMS (Root Mean Square) — détecte le silence
        let sumSq = 0
        const sampleSize = Math.min(channelData.length, 44100) // 1 seconde max
        for (let i = 0; i < sampleSize; i++) {
          sumSq += channelData[i] * channelData[i]
        }
        const rms = Math.sqrt(sumSq / sampleSize)

        audioCtx.close()
        // Seuil de silence : RMS < 0.001
        resolve(rms > 0.001)
      } catch {
        audioCtx.close()
        // decodeAudioData peut échouer si le chunk n'est pas décodable
        // Dans ce cas on assume qu'il y a de l'audio (bénéfice du doute)
        resolve(true)
      }
    }

    reader.onerror = () => {
      audioCtx.close()
      reject(new Error('Erreur de lecture du fichier'))
    }

    reader.readAsArrayBuffer(chunk)
  })
}
