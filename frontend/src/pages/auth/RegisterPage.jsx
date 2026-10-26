import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconBriefcase() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
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

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}

function IconHeartPulse() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      <path d="M3.22 12H9.5l1.5-5 3 9 1.5-4.5H22"/>
    </svg>
  )
}

function IconStethoscope() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
      <circle cx="20" cy="10" r="2"/>
    </svg>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { register: authRegister } = useAuth()
  const navigate = useNavigate()

  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('patient') // eslint-disable-line no-unused-vars

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { role: 'patient' },
  })

  const role = watch('role', 'patient')

  const onSubmit = async (data) => {
    setServerError('')
    const result = await authRegister(data)
    if (result.success) {
      const dest = result.user.role === 'provider' ? '/provider/dashboard' : '/patient/dashboard'
      navigate(dest, { replace: true })
    } else {
      setServerError(result.message)
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

      {/* ── Auth scene ── */}
      <div className="auth-scene">
        <div className="auth-logo">
          <div className="auth-logo-mark"><IconLogo /></div>
          <span className="auth-logo-text">BookMore</span>
        </div>

        <div className="glass-card auth-card auth-card-wide">
          <h2 className="auth-card-title">Create your account</h2>
          <p className="auth-card-subtitle">Get started — it only takes a minute.</p>

          {serverError && (
            <div className="glass-alert glass-alert-error">
              <span className="alert-icon"><IconAlertCircle /></span>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="stagger-form">
            {/* Role selector */}
            <div className="form-group">
              <span className="form-label">I am a <span className="required">*</span></span>
              <div className="role-selector">
                <label className="role-option">
                  <input
                    type="radio"
                    value="patient"
                    {...register('role')}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <div className="role-card">
                    <div className="role-card-icon"><IconHeartPulse /></div>
                    <span className="role-card-label">Patient</span>
                    <span className="role-card-sublabel">Book appointments</span>
                  </div>
                </label>

                <label className="role-option">
                  <input
                    type="radio"
                    value="provider"
                    {...register('role')}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <div className="role-card">
                    <div className="role-card-icon"><IconStethoscope /></div>
                    <span className="role-card-label">Provider</span>
                    <span className="role-card-sublabel">Manage patients</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Full name */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Full name <span className="required">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><IconUser /></span>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  className={`form-input has-icon${errors.name ? ' error' : ''}`}
                  {...register('name', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                />
              </div>
              {errors.name && (
                <p className="form-error"><IconAlertCircle /> {errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email address <span className="required">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><IconMail /></span>
                <input
                  id="reg-email"
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

            {/* Provider-only: specialisation */}
            {role === 'provider' && (
              <div className="form-group animate-fade-in-up">
                <label className="form-label" htmlFor="specialisation">
                  Specialisation <span className="required">*</span>
                </label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon"><IconBriefcase /></span>
                  <input
                    id="specialisation"
                    type="text"
                    placeholder="e.g. General Physician, Dentist, Therapist"
                    className={`form-input has-icon${errors.specialisation ? ' error' : ''}`}
                    {...register('specialisation', {
                      required: role === 'provider' ? 'Specialisation is required for providers' : false,
                    })}
                  />
                </div>
                {errors.specialisation && (
                  <p className="form-error"><IconAlertCircle /> {errors.specialisation.message}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password <span className="required">*</span>
              </label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><IconLock /></span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={`form-input has-icon${errors.password ? ' error' : ''}`}
                  style={{ paddingRight: 44 }}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
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
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <IconArrowRight />
                  </>
                )}
              </button>
            </div>

            <p className="terms-text">
              By creating an account you agree to our{' '}
              <a href="#">Terms of Service</a>{' '}and{' '}
              <a href="#">Privacy Policy</a>.
            </p>
          </form>

          <p className="auth-switch-text">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  )
}
