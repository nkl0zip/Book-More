import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function IconBM() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  )
}

function IconLogOut() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  const patientLinks = [
    { to: '/patient/dashboard',    label: 'Dashboard'    },
    { to: '/patient/book',         label: 'Book'         },
    { to: '/patient/appointments', label: 'Appointments' },
    { to: '/providers',            label: 'Providers'    },
  ]
  const providerLinks = [
    { to: '/provider/dashboard',    label: 'Dashboard'    },
    { to: '/provider/appointments', label: 'Appointments' },
    { to: '/provider/services',     label: 'My Services'  },
    { to: '/provider/slots',        label: 'My Slots'     },
    { to: '/provider/profile',      label: 'My Profile'   },
  ]
  const navLinks = user?.role === 'provider' ? providerLinks : patientLinks

  return (
    <nav className="glass-navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-mark"><IconBM /></div>
          <span className="navbar-logo-text">BookMore</span>
        </Link>

        {/* Nav links */}
        {isAuthenticated && (
          <div className="navbar-nav">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}

        {/* Right actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="navbar-user">
              <div className="navbar-avatar">{getInitials(user?.name)}</div>
              <span className="navbar-user-name">{user?.name?.split(' ')[0]}</span>
              <button
                className="btn glass-btn-ghost"
                onClick={handleLogout}
                style={{ gap: 'var(--sp-2)', height: 34, padding: '0 var(--sp-3)', fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)' }}
                title="Sign out"
              >
                <IconLogOut />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn glass-btn-secondary" style={{ height: 36, fontSize: '0.875rem' }}>
                Sign in
              </Link>
              <Link to="/register" className="btn glass-btn-primary" style={{ height: 36, fontSize: '0.875rem' }}>
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
