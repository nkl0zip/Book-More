import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { providerService } from '../../services/providerService'
import { serviceService } from '../../services/serviceService'
import { Spinner } from '../../components/ui/Spinner'

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

export default function ProviderDetailPage() {
  const { id } = useParams()
  const [provider, setProvider] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      providerService.getById(id),
      serviceService.getByProvider(id),
    ])
      .then(([pRes, sRes]) => {
        setProvider(pRes.data.provider ?? pRes.data.data)
        const list = sRes.data.services ?? sRes.data.data ?? []
        setServices(list)
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Could not load provider profile.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const initials = (name) =>
    name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb orb-1"/><div className="aurora-orb orb-2"/>
        <div className="aurora-orb orb-3"/><div className="aurora-orb orb-4"/>
        <div className="aurora-orb orb-5"/>
      </div>

      <div className="page-wrapper">
        <div className="page-container" style={{ maxWidth: 720 }}>

          {/* Back nav */}
          <div style={{ marginBottom: 'var(--sp-6)', animation: 'slideInUp 0.4s var(--ease) both' }}>
            <Link to="/providers" className="btn glass-btn-ghost" style={{ textDecoration: 'none' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              All Providers
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-16)' }}>
              <Spinner size={32} />
            </div>
          ) : error ? (
            <div className="glass-alert glass-alert-error" role="alert">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          ) : !provider ? null : (
            <>
              {/* Hero card */}
              <div className="content-card" style={{ marginBottom: 'var(--sp-5)', animation: 'slideInUp 0.4s var(--ease) 40ms both' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-5)', flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', fontWeight: 800, color: 'white', overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
                  }}>
                    {provider.avatarUrl
                      ? <img src={provider.avatarUrl} alt={provider.name}
                             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                             onError={e => { e.target.style.display = 'none' }} />
                      : initials(provider.name)
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {provider.name}
                    </h1>
                    {provider.specialisation && (
                      <div style={{ marginTop: 'var(--sp-1)', fontSize: '0.9375rem', color: 'var(--accent)', fontWeight: 500 }}>
                        {provider.specialisation}
                      </div>
                    )}
                    <div style={{ marginTop: 'var(--sp-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
                      {provider.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          {provider.email}
                        </span>
                      )}
                      {provider.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.4 1.13 2 2 0 012 .94h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                          </svg>
                          {provider.phone}
                        </span>
                      )}
                      {provider.createdAt && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Member since {fmtDate(provider.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    to={`/patient/book?providerId=${id}`}
                    className="btn glass-btn-primary"
                    style={{ textDecoration: 'none', flexShrink: 0 }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Book Appointment
                  </Link>
                </div>

                {/* Bio */}
                {provider.bio && (
                  <div style={{ marginTop: 'var(--sp-5)', paddingTop: 'var(--sp-5)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-2)' }}>About</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, margin: 0 }}>
                      {provider.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* Services */}
              <div style={{ animation: 'slideInUp 0.4s var(--ease) 100ms both' }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--sp-4)' }}>
                  Services Offered
                </h2>
                {services.length === 0 ? (
                  <div className="content-card">
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--sp-6) 0', margin: 0 }}>
                      No services listed yet.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--sp-4)' }}>
                    {services.map(svc => (
                      <div key={svc._id} className="content-card" style={{ padding: 'var(--sp-4)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--sp-1)' }}>
                          {svc.name}
                        </div>
                        {svc.description && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 var(--sp-3)' }}>
                            {svc.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                          {svc.durationMinutes && (
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                              </svg>
                              {svc.durationMinutes} min
                            </span>
                          )}
                          {svc.price != null && (
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(52,211,153,0.85)' }}>
                              {svc.currency ?? '€'}{Number(svc.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}
