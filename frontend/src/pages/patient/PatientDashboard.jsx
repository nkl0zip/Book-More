import { useAuth } from '../../context/AuthContext'

export default function PatientDashboard() {
  const { user } = useAuth()
  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Book and manage your appointments here.</p>
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Your patient dashboard is ready. Appointment booking features will appear here in the next sprint.
        </p>
      </div>
    </main>
  )
}
