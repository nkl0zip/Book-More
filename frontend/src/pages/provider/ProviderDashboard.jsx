import { useAuth } from '../../context/AuthContext'

export default function ProviderDashboard() {
  const { user } = useAuth()

  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb orb-1" />
        <div className="aurora-orb orb-2" />
        <div className="aurora-orb orb-3" />
        <div className="aurora-orb orb-4" />
        <div className="aurora-orb orb-5" />
      </div>

      <div className="page-wrapper">
        <main className="page-container">
          <div className="page-header">
            <h1 className="page-title">Provider Dashboard</h1>
            <p className="page-subtitle">Hello, {user?.name}. Manage your slots and appointments here.</p>
          </div>

          <div
            className="glass-card"
            style={{ maxWidth: 560, padding: 'var(--sp-8)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
              Your provider dashboard is ready. Slot and service management features will appear here in the next sprint.
            </p>
          </div>
        </main>
      </div>
    </>
  )
}
