// Layout front-office public (mobile-first)
import { Outlet } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* En-tête Orchestra */}
      <header className="bg-orchestra-red px-4 py-0 flex items-center justify-center h-14 shrink-0 shadow-sm">
        <img src="/bloc-marque_ORC_FR_WHITE_2025.png" alt="Orchestra" className="h-7 w-auto" />
      </header>

      {/* Contenu mobile-first */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Pied de page */}
      <footer className="py-5 border-t border-gray-100 text-center text-xs text-gray-300">
        © {new Date().getFullYear()} Orchestra — Plateforme UGC
      </footer>
    </div>
  )
}
