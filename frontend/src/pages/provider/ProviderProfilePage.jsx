import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { providerService } from '../../services/providerService'
import { Spinner } from '../../components/ui/Spinner'

// ── Icons ────────────────────────────────────────────────────────────────────

function IconChevLeft() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconBriefcase() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .94h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  )
}

function IconImage() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}

function IconAlignLeft() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="13" y1="18" x2="3" y2="18"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconAlert() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

function IconTriangle() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name) =>
  name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

// ── Component ────────────────────────────────────────────────────────────────

export default function ProviderProfilePage() {
  const { user } = useAuth()
  const [serverError, setServerError]       = useState('')
  const [successMsg, setSuccessMsg]         = useState('')
  const [loadError, setLoadError]           = useState('')
  const [fetchDone, setFetchDone]           = useState(false)
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [deactivating, setDeactivating]     = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ mode: 'onTouched' })

  const avatarUrl       = watch('avatarUrl', '')
  const watchedName     = watch('name', '')
  const watchedSpec     = watch('specialisation', '')

  useEffect(() => {
    providerService.getMyProfile()
      .then(res => {
        const p = res.data.provider ?? res.data.data
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

  const displayName = watchedName || user?.name || ''
  const displaySpec = watchedSpec || user?.specialisation || ''

  return (
    <>
      {/* Aurora */}
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb orb-1" /><div className="aurora-orb orb-2" />
        <div className="aurora-orb orb-3" /><div className="aurora-orb orb-4" />
        <div className="aurora-orb orb-5" />
      </div>

      <div className="page-wrapper">
        <div className="page-container" style={{ maxWidth: 760 }}>

          {/* Back nav */}
          <div style={{ marginBottom: 'var(--sp-6)', animationDelay: '0ms' }}>
            <Link
              to="/provider/dashboard"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)',
                color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <IconChevLeft /> Dashboard
            </Link>
          </div>

          {/* Load error */}
          {loadError && (
            <div className="glass-alert glass-alert-error" role="alert" style={{ marginBottom: 'var(--sp-6)' }}>
              <IconAlert /> {loadError}
            </div>
          )}

          {fetchDone && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

              {/* ── Hero banner ─────────────────────────────────────────── */}
              <div className="content-card" style={{ marginBottom: 'var(--sp-5)', animationDelay: '60ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-6)', flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div className="profile-avatar-lg" style={{ width: 96, height: 96, fontSize: '2rem' }}>
                      {avatarUrl
                        ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                               onError={e => { e.target.style.display = 'none' }} />
                        : initials(displayName)}
                    </div>
                  </div>

                  {/* Identity */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="profile-banner-name" style={{ marginBottom: 'var(--sp-1)' }}>
                      {displayName || <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>Your name</span>}
                    </div>
                    {displaySpec && (
                      <div className="profile-banner-specialisation">{displaySpec}</div>
                    )}
                    <div className="profile-banner-meta" style={{ marginTop: 'var(--sp-2)' }}>
                      <span className="profile-badge">
                        <svg width="10" height="10" fill="currentColor" viewBox="0 0 10 10">
                          <circle cx="5" cy="5" r="5" opacity="0.5"/>
                          <circle cx="5" cy="5" r="2.5"/>
                        </svg>
                        Provider
                      </span>
                      <span className="profile-meta-item">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Alerts ──────────────────────────────────────────────── */}
              {successMsg && (
                <div className="success-banner" style={{ animationDelay: '0ms' }}>
                  <IconCheck /> {successMsg}
                </div>
              )}
              {serverError && (
                <div className="glass-alert glass-alert-error" role="alert" style={{ marginBottom: 'var(--sp-5)' }}>
                  <IconAlert /> {serverError}
                </div>
              )}

              {/* ── Avatar URL ──────────────────────────────────────────── */}
              <div className="content-card" style={{ marginBottom: 'var(--sp-5)', animationDelay: '120ms' }}>
                <div className="content-card-header">
                  <span className="content-card-title">Profile Photo</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Optional</span>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="avatarUrl">Photo URL</label>
                  <div className="form-input-wrapper">
                    <span className="form-input-icon"><IconImage /></span>
                    <input
                      id="avatarUrl"
                      type="url"
                      className={`form-input has-icon${errors.avatarUrl ? ' error' : ''}`}
                      placeholder="https://example.com/photo.jpg"
                      {...register('avatarUrl', {
                        validate: v => !v || /^https?:\/\/.+/.test(v) || 'Must be a valid URL',
                      })}
                    />
                  </div>
                  {errors.avatarUrl
                    ? <p className="form-error"><IconAlert /> {errors.avatarUrl.message}</p>
                    : <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: 'var(--sp-2)' }}>
                        Paste a direct link to a publicly accessible image.
                      </p>
                  }
                </div>
              </div>

              {/* ── Personal info ───────────────────────────────────────── */}
              <div className="content-card" style={{ marginBottom: 'var(--sp-5)', animationDelay: '170ms' }}>
                <div className="content-card-header">
                  <span className="content-card-title">Personal Information</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }} className="profile-info-grid">
                  {/* Name */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="name">Full Name <span className="required">*</span></label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><IconUser /></span>
                      <input
                        id="name"
                        type="text"
                        className={`form-input has-icon${errors.name ? ' error' : ''}`}
                        placeholder="Dr. Jane Smith"
                        {...register('name', {
                          minLength: { value: 2, message: 'At least 2 characters' },
                          maxLength: { value: 100, message: 'Max 100 characters' },
                        })}
                      />
                    </div>
                    {errors.name && <p className="form-error"><IconAlert /> {errors.name.message}</p>}
                  </div>

                  {/* Specialisation */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="specialisation">Specialisation <span className="required">*</span></label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><IconBriefcase /></span>
                      <input
                        id="specialisation"
                        type="text"
                        className={`form-input has-icon${errors.specialisation ? ' error' : ''}`}
                        placeholder="e.g. Cardiology, Dentistry"
                        {...register('specialisation', {
                          minLength: { value: 2, message: 'At least 2 characters' },
                          maxLength: { value: 100, message: 'Max 100 characters' },
                        })}
                      />
                    </div>
                    {errors.specialisation && <p className="form-error"><IconAlert /> {errors.specialisation.message}</p>}
                  </div>

                  {/* Phone */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="phone">Phone Number</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><IconPhone /></span>
                      <input
                        id="phone"
                        type="tel"
                        className={`form-input has-icon${errors.phone ? ' error' : ''}`}
                        placeholder="+1 (555) 000-0000"
                        {...register('phone', {
                          pattern: {
                            value: /^[+\d\s\-().]{7,20}$/,
                            message: 'Enter a valid phone number',
                          },
                        })}
                      />
                    </div>
                    {errors.phone && <p className="form-error"><IconAlert /> {errors.phone.message}</p>}
                  </div>
                </div>
              </div>

              {/* ── Bio ─────────────────────────────────────────────────── */}
              <div className="content-card" style={{ marginBottom: 'var(--sp-5)', animationDelay: '220ms' }}>
                <div className="content-card-header">
                  <span className="content-card-title">About You</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Visible to patients</span>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="bio">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <IconAlignLeft /> Bio
                    </span>
                  </label>
                  <textarea
                    id="bio"
                    className={`form-textarea${errors.bio ? ' error' : ''}`}
                    placeholder="Tell patients about your background, experience, and approach to care…"
                    rows={5}
                    {...register('bio', {
                      maxLength: { value: 500, message: 'Bio cannot exceed 500 characters' },
                    })}
                  />
                  {errors.bio
                    ? <p className="form-error"><IconAlert /> {errors.bio.message}</p>
                    : <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: 'var(--sp-2)' }}>
                        Max 500 characters.
                      </p>
                  }
                </div>
              </div>

              {/* ── Save footer ─────────────────────────────────────────── */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)',
                marginBottom: 'var(--sp-5)', animationDelay: '250ms',
              }}>
                {isDirty && (
                  <button type="button" className="btn glass-btn-ghost"
                    onClick={() => { reset(); setSuccessMsg(''); setServerError('') }}>
                    Discard
                  </button>
                )}
                <button
                  type="submit"
                  className="btn glass-btn-primary"
                  disabled={isSubmitting || !isDirty}
                >
                  {isSubmitting ? (
                    <><Spinner size={16} color="rgba(255,255,255,0.85)" /> Saving…</>
                  ) : 'Save Changes'}
                </button>
              </div>

              {/* ── Danger zone ─────────────────────────────────────────── */}
              <div className="content-card" style={{
                animationDelay: '280ms',
                borderColor: 'rgba(248,113,113,0.18)',
                borderTopColor: 'rgba(248,113,113,0.35)',
              }}>
                <div className="content-card-header">
                  <span className="content-card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: 'rgba(252,165,165,0.9)' }}>
                    <IconTriangle /> Danger Zone
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--sp-5)', lineHeight: 1.6 }}>
                  Deactivating your account hides your profile from patients and disables new bookings.
                  This action cannot be undone from within the app.
                </p>
                {!showDeactivate ? (
                  <button
                    type="button"
                    className="btn glass-btn-ghost"
                    style={{ color: 'rgba(252,165,165,0.9)', borderColor: 'rgba(248,113,113,0.30)' }}
                    onClick={() => setShowDeactivate(true)}
                  >
                    Deactivate Account
                  </button>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                    flexWrap: 'wrap',
                    padding: 'var(--sp-4) var(--sp-5)',
                    borderRadius: 'var(--r-md)',
                    background: 'rgba(127,29,29,0.25)',
                    border: '1px solid rgba(248,113,113,0.25)',
                  }}>
                    <IconTriangle style={{ color: 'rgba(252,165,165,0.9)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'rgba(252,165,165,0.9)', flex: 1 }}>
                      This will permanently deactivate your account. Are you sure?
                    </span>
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                      <button type="button" className="btn glass-btn-ghost" onClick={() => setShowDeactivate(false)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn glass-btn-ghost"
                        style={{ color: 'rgba(252,165,165,0.9)', borderColor: 'rgba(248,113,113,0.30)' }}
                        onClick={handleDeactivate}
                        disabled={deactivating}
                      >
                        {deactivating ? <><Spinner size={14} color="rgba(252,165,165,0.85)" /> Deactivating…</> : 'Yes, deactivate'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </form>
          )}

        </div>
      </div>

      <style>{`
        @media (max-width: 560px) {
          .profile-info-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}
