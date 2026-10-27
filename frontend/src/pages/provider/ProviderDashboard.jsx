import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { providerService } from '../../services/providerService'

export default function ProviderDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    providerService.getMyProfile()
      .then(res => setProfile(res.data.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  const initials = (name) =>
    name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  const stats = [
    { label: 'Appointments Today', value: '—', icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )},
    { label: 'Total Patients', value: '—', icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )},
    { label: 'Profile Views', value: '—', icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )},
    { label: 'Rating', value: '—', icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    )},
  ]

  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb orb-1"/>
        <div className="aurora-orb orb-2"/>
        <div className="aurora-orb orb-3"/>
        <div className="aurora-orb orb-4"/>
        <div className="aurora-orb orb-5"/>
      </div>

      <div className="page-wrapper">
        <div className="page-container">

          {/* Banner */}
          <div className="profile-banner">
            <div className="profile-avatar-lg">
              {profile?.avatarUrl
                ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : initials(profile?.name || user?.name || '')}
            </div>
            <div className="profile-banner-info">
              <div className="profile-banner-name">
                {loading ? 'Loading…' : (profile?.name || user?.name || 'Provider')}
              </div>
              {profile?.specialisation && (
                <div className="profile-banner-specialisation">{profile.specialisation}</div>
              )}
              <div className="profile-banner-meta">
                <span className="profile-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  Active
                </span>
                {profile?.phone && (
                  <span className="profile-meta-item">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .94h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                    {profile.phone}
                  </span>
                )}
                <span className="profile-meta-item">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {user?.email}
                </span>
              </div>
            </div>
            <Link to="/provider/profile" className="glass-btn-secondary" style={{ flexShrink: 0 }}>
              Edit Profile
            </Link>
          </div>

          {/* Stats */}
          <div className="stat-grid">
            {stats.map((s, i) => (
              <div className="stat-card" key={s.label} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="stat-card-icon">{s.icon}</div>
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="content-card" style={{ animationDelay: '200ms' }}>
            <div className="content-card-header">
              <span className="content-card-title">Quick Actions</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--sp-4)' }}>
              <Link to="/provider/profile" className="glass-btn-secondary" style={{ justifyContent: 'center', padding: 'var(--sp-4)' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 'var(--sp-2)' }}>
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Manage Profile
              </Link>
              <button className="glass-btn-ghost" style={{ justifyContent: 'center', padding: 'var(--sp-4)', opacity: 0.5, cursor: 'not-allowed' }} disabled>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 'var(--sp-2)' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Appointments <span style={{ fontSize: '0.7rem', marginLeft: 4 }}>(soon)</span>
              </button>
            </div>
          </div>

          {/* Bio section */}
          {profile?.bio && (
            <div className="content-card" style={{ marginTop: 'var(--sp-5)', animationDelay: '260ms' }}>
              <div className="content-card-header">
                <span className="content-card-title">About Me</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{profile.bio}</p>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
