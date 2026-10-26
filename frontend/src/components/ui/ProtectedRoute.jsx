import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../ui/Spinner'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, initialising } = useAuth()
  const location = useLocation()

  if (initialising) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 'var(--space-3)',
        color: 'var(--color-text-tertiary)',
      }}>
        <Spinner size={24} color="var(--color-accent)" />
        <span style={{ fontSize: '0.9375rem' }}>Loading…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const fallback = user?.role === 'provider' ? '/provider/dashboard' : '/patient/dashboard'
    return <Navigate to={fallback} replace />
  }

  return children
}
