import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { providerService } from '../../services/providerService'

export default function ProviderProfilePage() {
  const { user } = useAuth()
  const [serverError, setServerError]   = useState('')
  const [successMsg, setSuccessMsg]     = useState('')
  const [loadError, setLoadError]       = useState('')
  const [fetchDone, setFetchDone]       = useState(false)
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ mode: 'onTouched' })

  const avatarUrl = watch('avatarUrl', '')

  useEffect(() => {
    providerService.getMyProfile()
      .then(res => {
        const p = res.data.data
        reset({
          name:           p.name           ?? '',
          specialisation: p.specialisation ?? '',
          bio:            p.bio            ?? '',
          phone:          p.phone          ?? '',
          avatarUrl:      p.avatarUrl      ?? '',
        })
      })
      .catch(() => setLoadError('Could not load your profile. Please refresh.'))
      .finally(() => setFetchDone(true))
  }, [reset])

  const onSubmit = async (data) => {
    setServerError('')
    setSuccessMsg('')
    try {
      await providerService.updateMyProfile(data)
      setSuccessMsg('Profile updated successfully.')
      reset(data)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Update failed. Please try again.')
    }
  }

  const handleDeactivate = async () => {
    setDeactivating(true)
    try {
      await providerService.deactivateAccount()
      window.location.href = '/login'
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not deactivate account.')
      setDeactivating(false)
    }
  }

  const initials = (name) =>
    name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

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
        <div className="page-container" style={{ maxWidth: 720 }}>

          {/* Header */}
          <div className="page-header" style={{ animationDelay: '0ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-2)' }}>
              <Link to="/provider/dashboard" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: '0.875rem', textDecoration: 'none' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Dashboard
              </Link>
            </div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">Manage your public profile and contact details.</p>
          </div>

          {loadError && (
            <div className="glass-alert" role="alert" style={{ marginBottom: 'var(--sp-6)' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {loadError}
            </div>
          )}

          {fetchDone && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

              {/* Avatar preview */}
              <div className="content-card" style={{ marginBottom: 'var(--sp-5)', animationDelay: '80ms' }}>
                <div className="content-card-header">
                  <span className="content-card-title">Avatar</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)' }}>
                  <div className="profile-avatar-lg">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                             onError={e => { e.target.style.display = 'none' }} />
                      : initials(user?.name || '')}
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label" htmlFor="avatarUrl">Avatar URL</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </span>
                      <input
                        id="avatarUrl"
                        type="url"
                        className={`form-input form-input-icon${errors.avatarUrl ? ' error' : ''}`}
                        placeholder="https://example.com/photo.jpg"
                        {...register('avatarUrl', {
                          validate: v => !v || /^https?:\/\/.+/.test(v) || 'Must be a valid URL',
                        })}
                      />
                    </div>
                    {errors.avatarUrl && <p className="form-error">{errors.avatarUrl.message}</p>}
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="content-card" style={{ marginBottom: 'var(--sp-5)', animationDelay: '130ms' }}>
                <div className="content-card-header">
                  <span className="content-card-title">Basic Information</span>
                </div>

                {successMsg && (
                  <div className="success-banner">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {successMsg}
                  </div>
                )}
                {serverError && (
                  <div className="glass-alert" role="alert" style={{ marginBottom: 'var(--sp-5)' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {serverError}
                  </div>
                )}

                <div className="stagger-form">
                  {/* Name */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Full Name</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      </span>
                      <input
                        id="name"
                        type="text"
                        className={`form-input form-input-icon${errors.name ? ' error' : ''}`}
                        placeholder="Dr. Jane Smith"
                        {...register('name', {
                          minLength: { value: 2, message: 'Name must be at least 2 characters' },
                          maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
                        })}
                      />
                    </div>
                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                  </div>

                  {/* Specialisation */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="specialisation">Specialisation</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      </span>
                      <input
                        id="specialisation"
                        type="text"
                        className={`form-input form-input-icon${errors.specialisation ? ' error' : ''}`}
                        placeholder="e.g. General Practice, Cardiology"
                        {...register('specialisation', {
                          minLength: { value: 2, message: 'Must be at least 2 characters' },
                          maxLength: { value: 100, message: 'Cannot exceed 100 characters' },
                        })}
                      />
                    </div>
                    {errors.specialisation && <p className="form-error">{errors.specialisation.message}</p>}
                  </div>

                  {/* Phone */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone Number</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .94h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                      </span>
                      <input
                        id="phone"
                        type="tel"
                        className={`form-input form-input-icon${errors.phone ? ' error' : ''}`}
                        placeholder="+1 (555) 000-0000"
                        {...register('phone', {
                          pattern: {
                            value: /^[+\d\s\-().]{7,20}$/,
                            message: 'Please enter a valid phone number',
                          },
                        })}
                      />
                    </div>
                    {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                  </div>

                  {/* Bio */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="bio">
                      Bio
                      <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 'var(--sp-2)' }}>
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id="bio"
                      className={`form-textarea${errors.bio ? ' error' : ''}`}
                      placeholder="Tell patients a bit about yourself, your experience, and your approach to care…"
                      rows={4}
                      {...register('bio', {
                        maxLength: { value: 500, message: 'Bio cannot exceed 500 characters' },
                      })}
                    />
                    {errors.bio && <p className="form-error">{errors.bio.message}</p>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--sp-6)', paddingTop: 'var(--sp-4)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    type="submit"
                    className="glass-btn-primary"
                    disabled={isSubmitting || !isDirty}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="spin" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                        </svg>
                        Saving…
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="content-card" style={{ animationDelay: '200ms', borderColor: 'rgba(248,113,113,0.20)', borderTopColor: 'rgba(248,113,113,0.40)' }}>
                <div className="content-card-header">
                  <span className="content-card-title" style={{ color: 'rgba(252,165,165,0.9)' }}>Danger Zone</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--sp-5)' }}>
                  Deactivating your account will hide your profile from patients. This action cannot be undone from the app.
                </p>
                {!showDeactivate ? (
                  <button type="button" className="glass-btn-ghost" style={{ color: 'rgba(252,165,165,0.9)', borderColor: 'rgba(248,113,113,0.30)' }}
                    onClick={() => setShowDeactivate(true)}>
                    Deactivate Account
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Are you sure?</span>
                    <button type="button" className="glass-btn-ghost" style={{ color: 'rgba(252,165,165,0.9)', borderColor: 'rgba(248,113,113,0.30)' }}
                      onClick={handleDeactivate} disabled={deactivating}>
                      {deactivating ? 'Deactivating…' : 'Yes, deactivate'}
                    </button>
                    <button type="button" className="glass-btn-ghost" onClick={() => setShowDeactivate(false)}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>

            </form>
          )}

        </div>
      </div>
    </>
  )
}
