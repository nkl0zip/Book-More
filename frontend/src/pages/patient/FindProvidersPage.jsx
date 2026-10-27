import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { providerService } from '../../services/providerService'

export default function FindProvidersPage() {
  const [providers, setProviders]       = useState([])
  const [total, setTotal]               = useState(0)
  const [page, setPage]                 = useState(1)
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [searchInput, setSearchInput]   = useState('')
  const [specialisation, setSpecialisation] = useState('')
  const limit = 9

  const fetchProviders = useCallback(() => {
    setLoading(true)
    const params = { page, limit }
    if (search)         params.search = search
    if (specialisation) params.specialisation = specialisation

    providerService.getAll(params)
      .then(res => {
        setProviders(res.data.data)
        setTotal(res.data.total || 0)
      })
      .catch(() => setProviders([]))
      .finally(() => setLoading(false))
  }, [page, search, specialisation])

  useEffect(() => { fetchProviders() }, [fetchProviders])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setSearchInput('')
    setSpecialisation('')
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  const initials = (name) =>
    name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  const specialisations = [
    'General Practice', 'Cardiology', 'Dermatology', 'Neurology',
    'Orthopaedics', 'Paediatrics', 'Psychiatry', 'Radiology',
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

          {/* Header */}
          <div className="page-header" style={{ animationDelay: '0ms' }}>
            <h1 className="page-title">Find a Provider</h1>
            <p className="page-subtitle">Browse our network of qualified healthcare professionals.</p>
          </div>

          {/* Search & filter toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap', marginBottom: 'var(--sp-8)', animation: 'slideInUp 0.5s var(--ease) 80ms both' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--sp-2)', flex: 1 }}>
              <div className="search-bar" style={{ flex: 1 }}>
                <span className="search-bar-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search by name, specialisation, or keyword…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </div>
              <button type="submit" className="glass-btn-primary" style={{ flexShrink: 0 }}>Search</button>
            </form>

            <select
              value={specialisation}
              onChange={e => { setSpecialisation(e.target.value); setPage(1) }}
              style={{
                height: 44,
                padding: '0 var(--sp-4)',
                background: 'var(--glass-bg-input)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--r-full)',
                color: specialisation ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9375rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">All Specialisations</option>
              {specialisations.map(s => (
                <option key={s} value={s} style={{ background: '#1a1a2e' }}>{s}</option>
              ))}
            </select>

            {(search || specialisation) && (
              <button type="button" className="glass-btn-ghost" onClick={clearFilters} style={{ flexShrink: 0 }}>
                Clear filters
              </button>
            )}
          </div>

          {/* Results count */}
          {!loading && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--sp-5)', animation: 'fadeIn 0.3s var(--ease)' }}>
              {total > 0 ? `${total} provider${total !== 1 ? 's' : ''} found` : 'No providers found'}
              {search && ` for "${search}"`}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-5)' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="provider-card" style={{ animationDelay: `${i * 60}ms`, minHeight: 200, opacity: 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 16, width: '60%', background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 8 }}/>
                      <div style={{ height: 12, width: '40%', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}/>
                    </div>
                  </div>
                  <div style={{ height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}/>
                  <div style={{ height: 12, width: '80%', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}/>
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="content-card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <div className="empty-state-title">No providers found</div>
                <div className="empty-state-desc">
                  {search || specialisation
                    ? 'Try adjusting your search or clearing the filters.'
                    : 'There are no registered providers yet. Check back soon.'}
                </div>
                {(search || specialisation) && (
                  <button className="glass-btn-secondary" onClick={clearFilters}>Clear filters</button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="provider-grid">
                {providers.map((p, i) => (
                  <Link
                    key={p._id}
                    to={`/providers/${p._id}`}
                    className="provider-card"
                    style={{ animationDelay: `${i * 50}ms`, textDecoration: 'none' }}
                  >
                    <div className="provider-card-header">
                      <div className="provider-avatar">
                        {p.avatarUrl
                          ? <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                 onError={e => { e.target.style.display = 'none' }} />
                          : initials(p.name)}
                      </div>
                      <div>
                        <div className="provider-card-name">{p.name}</div>
                        {p.specialisation && (
                          <div className="provider-card-spec">{p.specialisation}</div>
                        )}
                      </div>
                    </div>

                    {p.bio && <div className="provider-card-bio">{p.bio}</div>}

                    <div className="provider-card-footer">
                      {p.phone && (
                        <span className="profile-meta-item">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .94h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                          </svg>
                          {p.phone}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', color: 'var(--text-link)' }}>
                        View profile
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--sp-3)', marginTop: 'var(--sp-10)', animation: 'fadeIn 0.4s var(--ease)' }}>
                  <button
                    className="glass-btn-ghost"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Previous
                  </button>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="glass-btn-ghost"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  )
}
