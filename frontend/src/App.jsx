import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ui/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import PatientDashboard from './pages/patient/PatientDashboard'
import FindProvidersPage from './pages/patient/FindProvidersPage'
import ProviderDashboard from './pages/provider/ProviderDashboard'
import ProviderProfilePage from './pages/provider/ProviderProfilePage'
import ProviderServicesPage from './pages/provider/ProviderServicesPage'
import { useAuth } from './context/AuthContext'

function HomePage() {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'provider' ? '/provider/dashboard' : '/patient/dashboard'} replace />
  }
  return <Navigate to="/login" replace />
}

function NotFound() {
  return (
    <main style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', padding: 'var(--space-8)'
    }}>
      <h1 style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>404</h1>
      <h2 style={{ margin: 'var(--space-4) 0 var(--space-3)' }}>Page not found</h2>
      <p>The page you are looking for doesn&apos;t exist or has been moved.</p>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Auth routes — no navbar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* App routes — with navbar */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/providers"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <FindProvidersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/provider/dashboard"
          element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/provider/profile"
          element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/provider/services"
          element={
            <ProtectedRoute allowedRoles={['provider']}>
              <ProviderServicesPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
