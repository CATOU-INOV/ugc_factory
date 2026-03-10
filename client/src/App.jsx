import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'

// Layouts
import AdminLayout from './components/Layout/AdminLayout.jsx'
import MediaLayout from './components/Layout/MediaLayout.jsx'
import PublicLayout from './components/Layout/PublicLayout.jsx'

// Auth
import LoginPage from './pages/LoginPage.jsx'

// Admin pages
import AdminHome from './pages/admin/AdminHome.jsx'
import CampaignActivePage from './pages/admin/CampaignActivePage.jsx'
import CampaignPastPage from './pages/admin/CampaignPastPage.jsx'
import UsersPage from './pages/admin/UsersPage.jsx'
import ContractsPage from './pages/admin/ContractsPage.jsx'
import EmailLogsPage from './pages/admin/EmailLogsPage.jsx'

// Media pages
import MediaHome from './pages/media/MediaHome.jsx'
import MediaCampaignActive from './pages/media/MediaCampaignActive.jsx'
import MediaCampaignPast from './pages/media/MediaCampaignPast.jsx'

// Public pages
import CampaignPublicPage from './pages/public/CampaignPublicPage.jsx'
import ParticipationForm from './pages/public/ParticipationForm.jsx'
import ConfirmationPage from './pages/public/ConfirmationPage.jsx'
import ContractSignPage from './pages/public/ContractSignPage.jsx'

// ─── Route gardée par rôle ────────────────────────────────────────
function ProtectedRoute({ role, children }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    // Rediriger vers la bonne zone selon le rôle
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/media'} replace />
  }

  return children
}

function AppRoutes() {
  const { user, isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* ─── Authentification ─────────────────────────────────── */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/media'} replace />
            : <LoginPage />
        }
      />

      {/* ─── Back-office Admin ────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="campagne/:id" element={<CampaignActivePage />} />
        <Route path="campagne-passee/:id" element={<CampaignPastPage />} />
        <Route path="utilisateurs" element={<UsersPage />} />
        <Route path="contrats" element={<ContractsPage />} />
        <Route path="emails" element={<EmailLogsPage />} />
      </Route>

      {/* ─── Back-office Média ────────────────────────────────── */}
      <Route
        path="/media"
        element={
          <ProtectedRoute role="MEDIA">
            <MediaLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MediaHome />} />
        <Route path="campagne/:id" element={<MediaCampaignActive />} />
        <Route path="campagne-passee/:id" element={<MediaCampaignPast />} />
      </Route>

      {/* ─── Front-office public ──────────────────────────────── */}
      <Route path="/campagne/:slug" element={<PublicLayout />}>
        <Route index element={<CampaignPublicPage />} />
        <Route path="participer" element={<ParticipationForm />} />
        <Route path="confirmation" element={<ConfirmationPage />} />
      </Route>
      <Route path="/contrat/:token" element={<PublicLayout />}>
        <Route index element={<ContractSignPage />} />
      </Route>

      {/* ─── Redirections ─────────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
