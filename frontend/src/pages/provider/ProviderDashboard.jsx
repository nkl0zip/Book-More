import { useAuth } from '../../context/AuthContext'

export default function ProviderDashboard() {
  const { user } = useAuth()
  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Provider Dashboard</h1>
        <p className="page-subtitle">Hello, {user?.name}. Manage your slots and appointments here.</p>
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Your provider dashboard is ready. Slot and service management features will appear here in the next sprint.
        </p>
      </div>
    </main>
  )
}
