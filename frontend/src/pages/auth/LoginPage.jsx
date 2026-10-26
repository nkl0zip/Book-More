import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/Spinner'

// ── Inline SVG icons (no external icon lib needed) ──────────────────────────

function IconCalendar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3"/>
      <path d="m2 7 10 7 10-7"/>
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function IconEye({ off }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function IconAlertCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

// ── Feature highlights shown on the left panel ──────────────────────────────

const FEATURES = [
  { icon: <IconCalendar />, label: 'Book appointments in seconds' },
  { icon: <IconClock />,    label: 'Real-time availability updates' },
  { icon: <IconShield />,   label: 'Secure, private and encrypted' },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' })

  const onSubmit = async (data) => {
    setServerError('')
    const result = await login(data.email, data.password)
    if (result.success) {
      const dest = result.user.role === 'provider' ? '/provider/dashboard' : '/patient/dashboard'
      navigate(from !== '/' ? from : dest, { replace: true })
    } else {
      setServerError(result.message)
      setSubmitted(true)
    }
  }

  return (
    <div className="auth-root">
      {/* ── Left panel ── */}
      <div className="auth-illustration">
        <div className="auth-illustration-blob auth-illustration-blob-1" />
        <div className="auth-illustration-blob auth-illustration-blob-2" />

        <div className="auth-brand animate-fade-in-up">
          <div className="auth-brand-logo">
            <IconCalendar />
          </div>
          <h1>BookMore</h1>
          <p>Effortless appointment scheduling for patients and healthcare providers.</p>
        </div>

        <div className="auth-illustration-features stagger">
          {FEATURES.map((f, i) => (
            <div key={i} className="auth-feature-card animate-fade-in-up">
              <div className="auth-feature-icon">{f.icon}</div>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="auth-panel">
        <div className="auth-form-container animate-fade-in-up">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your BookMore account to continue.</p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="alert alert-error animate-fade-in">
              <span className="alert-icon"><IconAlertCircle /></span>
              <span>{serverError}</span>
            </div>
          )}

          {/* Redirect notice */}
          {location.state?.from && !submitted && (
            <div className="alert alert-info animate-fade-in">
              <span className="alert-icon"><IconShield /></span>
              <span>Please sign in to access that page.</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email address <span className="required">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="form-input-icon" style={{ left: 14 }}><IconMail /></span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`form-input has-icon${errors.email ? ' error' : ''}`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email address',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="form-error">
                  <IconAlertCircle /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <label className="form-label" htmlFor="password" style={{ margin: 0 }}>
                  Password <span className="required">*</span>
                </label>
                <a href="#" style={{ fontSize: '0.8125rem', fontWeight: 450 }}>Forgot password?</a>
              </div>
              <div className="form-input-wrapper">
                <span className="form-input-icon" style={{ left: 14 }}><IconLock /></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  className={`form-input has-icon${errors.password ? ' error' : ''}`}
                  style={{ paddingRight: 44 }}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  className="form-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <IconEye off={showPassword} />
                </button>
              </div>
              {errors.password && (
                <p className="form-error">
                  <IconAlertCircle /> {errors.password.message}
                </p>
              )}
            </div>

            <div style={{ marginTop: 'var(--space-6)' }}>
              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={18} color="rgba(255,255,255,0.8)" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <IconCheck />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account?{' '}
            <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
