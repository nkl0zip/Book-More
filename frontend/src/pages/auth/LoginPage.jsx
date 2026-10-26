import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/Spinner'

// ── Icons ────────────────────────────────────────────────────────────────────

function IconLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

function IconAlertCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
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

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}

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
    <>
      {/* ── Aurora background ── */}
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb orb-1" />
        <div className="aurora-orb orb-2" />
        <div className="aurora-orb orb-3" />
        <div className="aurora-orb orb-4" />
        <div className="aurora-orb orb-5" />
      </div>

      {/* ── Centered auth scene ── */}
      <div className="auth-scene">
        {/* Logo above card */}
        <div className="auth-logo">
          <div className="auth-logo-mark"><IconLogo /></div>
          <span className="auth-logo-text">BookMore</span>
        </div>

        {/* Glass card */}
        <div className="glass-card auth-card">
          <h2 className="auth-card-title">Welcome back</h2>
          <p className="auth-card-subtitle">Sign in to continue to BookMore</p>

          {/* Server error */}
          {serverError && (
            <div className="glass-alert glass-alert-error">
              <span className="alert-icon"><IconAlertCircle /></span>
              <span>{serverError}</span>
            </div>
          )}

          {/* Redirect notice */}
          {location.state?.from && !submitted && (
            <div className="glass-alert glass-alert-info">
              <span className="alert-icon"><IconShield /></span>
              <span>Please sign in to access that page.</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="stagger-form">
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email address <span className="required">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><IconMail /></span>
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
                <p className="form-error"><IconAlertCircle /> {errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="password" style={{ margin: 0 }}>
                  Password <span className="required">*</span>
                </label>
                <a href="#" className="form-forgot-link">Forgot password?</a>
              </div>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><IconLock /></span>
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
                <p className="form-error"><IconAlertCircle /> {errors.password.message}</p>
              )}
            </div>

            <div className="form-group" style={{ marginTop: 'var(--sp-6)', marginBottom: 0 }}>
              <button
                type="submit"
                className="btn glass-btn-primary btn-full btn-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={18} color="rgba(255,255,255,0.85)" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <IconArrowRight />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="auth-switch-text">
            Don&apos;t have an account?{' '}
            <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </>
  )
}
