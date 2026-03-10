// PAGE 0 — Authentification
// Route : /login

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const user = await login(email, password)
      navigate(user.role === 'ADMIN' ? '/admin' : '/media', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche — branding Orchestra (desktop uniquement) */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 bg-orchestra-red flex-col items-center justify-between py-16 px-12"
        aria-hidden="true"
      >
        <div />

        <div className="flex flex-col items-center text-center gap-8">
          <img src="/bloc-marque_ORC_FR_WHITE_2025.png" alt="" className="h-14 w-auto" />
          <div className="space-y-3">
            <h1 className="text-white text-2xl font-display font-black tracking-wide">
              UGC Factory
            </h1>
            <p className="text-white/70 text-sm leading-relaxed max-w-[240px]">
              Plateforme de gestion des contenus créateurs Orchestra
            </p>
          </div>
        </div>

        {/* Décoration bas */}
        <p className="text-white/30 text-xs">© {new Date().getFullYear()} Orchestra</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 bg-gray-50">
        {/* Logo mobile uniquement */}
        <div className="lg:hidden mb-10 text-center">
          <img src="/bloc-marque_ORC_FR_2025.png" alt="Orchestra" className="h-10 w-auto mx-auto" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display font-black text-gray-900 text-2xl">Connexion</h2>
            <p className="text-gray-500 text-sm mt-1">Accédez à votre espace Orchestra</p>
          </div>

          <div className="card p-8 shadow-md">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input"
                  placeholder="admin@orchestra.fr"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-orchestra w-full mt-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connexion…
                  </>
                ) : 'Se connecter'}
              </button>
            </form>
          </div>

          {/* Aide POC */}
          <div className="mt-5 px-1 text-xs text-gray-400 space-y-1">
            <p className="font-semibold text-gray-500 mb-2">Comptes de test :</p>
            <p>Admin : <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">admin@orchestra.fr</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">admin123</code></p>
            <p>Média : <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">media@orchestra.fr</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">media123</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
