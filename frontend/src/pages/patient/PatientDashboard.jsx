import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { appointmentService } from '../../services/appointmentService'
import { Spinner } from '../../components/ui/Spinner'

/* ── helpers ─────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

function fmtCountdown(d) {
  const ms = new Date(d).getTime() - Date.now()
  if (ms <= 0) return null
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const days = Math.floor(h / 24)
  if (days >= 2) return `in ${days} days`
  if (days === 1) return 'tomorrow'
  if (h > 0) return `in ${h}h ${totalMin % 60}m`
  return `in ${totalMin}m`
}

const STATUS_META = {
  confirmed:   { label: 'Confirmed',   bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.3)',   text: 'rgba(167,139,250,0.9)' },
  pending:     { label: 'Pending',     bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)',  text: 'rgba(253,211,77,0.9)'  },
  completed:   { label: 'Completed',   bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  text: 'rgba(52,211,153,0.9)'  },
  cancelled:   { label: 'Cancelled',   bg: 'rgba(220,38,38,0.12)',   border: 'rgba(248,113,113,0.25)', text: 'rgba(252,165,165,0.9)' },
  rescheduled: { label: 'Rescheduled', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.25)', text: 'rgba(156,163,175,0.9)' },
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending
  return (
    <span style={{
      fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
      background: m.bg, border: `1px solid ${m.border}`, color: m.text,
    }}>
      {m.label}
    </span>
  )
}

/* ── stat tile ───────────────────────────────────────────────────── */
function StatTile({ value, label, icon, color, bg, border, delay }) {
  return (
    <div style={{
      flex: '1 1 130px',
      background: bg, border: `1px solid ${border}`, borderRadius: 'var(--r-lg)',
      padding: 'var(--sp-4) var(--sp-5)',
      display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)',
      animation: `slideInUp 0.4s var(--ease) ${delay}ms both`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--r-md)',
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: 4 }}>
          {label}
        </div>
      </div>
    </div>
  )
}

/* ── quick action tile ───────────────────────────────────────────── */
function ActionTile({ to, label, desc, color, bg, border, icon, delay }) {
  return (
    <Link to={to} style={{
      flex: '1 1 160px',
      textDecoration: 'none',
      display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)',
      padding: 'var(--sp-4) var(--sp-5)',
      background: bg, border: `1px solid ${border}`, borderRadius: 'var(--r-lg)',
      transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
      animation: `slideInUp 0.4s var(--ease) ${delay}ms both`,
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = color.replace('0.2', '0.45') }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = border }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 'var(--r-md)',
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        flexShrink: 0,
      }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{desc}</div>
      </div>
    </Link>
  )
}

/* ── upcoming row ────────────────────────────────────────────────── */
function UpcomingRow({ appt, idx }) {
  const countdown = fmtCountdown(appt.startTime)
  const isToday   = new Date(appt.startTime).toDateString() === new Date().toDateString()
  const initials  = appt.provider?.name
    ? appt.provider.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
      padding: 'var(--sp-4) 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      animation: `slideInUp 0.4s var(--ease) ${200 + idx * 55}ms both`,
    }}>
      {/* avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.8125rem', fontWeight: 800, color: 'white',
        outline: isToday ? '2px solid rgba(139,92,246,0.55)' : 'none',
        outlineOffset: 2,
      }}>
        {appt.provider?.avatarUrl
          ? <img src={appt.provider.avatarUrl} alt=""
                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                 onError={e => { e.target.style.display = 'none' }} />
          : initials}
      </div>

      {/* name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem', whiteSpace: 'nowrap' }}>
            {appt.provider?.name}
          </span>
          <StatusBadge status={appt.status} />
          {isToday && (
            <span style={{
              fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '2px 7px', borderRadius: 99,
              background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.35)',
              color: 'rgba(196,181,253,0.9)',
            }}>Today</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          {appt.provider?.specialisation && (
            <span style={{ fontSize: '0.8rem', color: 'rgba(139,92,246,0.75)', fontWeight: 500 }}>
              {appt.provider.specialisation}
            </span>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {fmtDate(appt.startTime)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {fmtTime(appt.startTime)}
          </span>
          {appt.service?.name && (
            <span className="slot-service-tag" style={{ fontSize: '0.75rem' }}>{appt.service.name}</span>
          )}
        </div>
      </div>

      {/* countdown pill */}
      {countdown && (
        <div style={{
          flexShrink: 0, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
          padding: '4px 10px', borderRadius: 'var(--r-md)',
          color: isToday ? 'rgba(167,139,250,0.9)' : 'var(--text-tertiary)',
          background: isToday ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isToday ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
        }}>
          {countdown}
        </div>
      )}
    </div>
  )
}

/* ── section header helper ───────────────────────────────────────── */
function SectionHeader({ iconBg, iconBorder, iconColor, iconPath, title, linkTo, linkLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 'var(--r-md)',
          background: iconBg, border: `1px solid ${iconBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor,
        }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {iconPath}
          </svg>
        </div>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{title}</span>
      </div>
      {linkTo && (
        <Link to={linkTo} className="btn glass-btn-ghost"
          style={{ height: 28, paddingInline: 'var(--sp-3)', fontSize: '0.75rem', textDecoration: 'none' }}>
          {linkLabel}
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      )}
    </div>
  )
}

/* ── page ────────────────────────────────────────────────────────── */
export default function PatientDashboard() {
  const { user } = useAuth()
  const [stats,    setStats]    = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [recent,   setRecent]   = useState([])
  const [loading,  setLoading]  = useState(true)

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const greeting  = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const load = useCallback(() => {
    setLoading(true)
    const now = new Date().toISOString()
    Promise.all([
      appointmentService.getStats(),
      appointmentService.getMine({ status: 'confirmed,pending', from: now, limit: 5 }),
      appointmentService.getMine({ status: 'completed', limit: 3 }),
    ])
      .then(([sRes, uRes, rRes]) => {
        setStats(sRes.data.data)
        setUpcoming(uRes.data.data ?? [])
        setRecent(rRes.data.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const STATS = [
    {
      value: stats?.confirmed ?? 0, label: 'Upcoming',
      color: 'rgba(167,139,250,0.95)', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.22)', delay: 40,
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
    {
      value: stats?.completed ?? 0, label: 'Completed',
      color: 'rgba(52,211,153,0.95)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.22)', delay: 80,
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    },
    {
      value: stats?.cancelled ?? 0, label: 'Cancelled',
      color: 'rgba(252,165,165,0.9)', bg: 'rgba(220,38,38,0.08)', border: 'rgba(248,113,113,0.2)', delay: 120,
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    },
    {
      value: stats?.total ?? 0, label: 'Total Booked',
      color: 'rgba(129,140,248,0.95)', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.22)', delay: 160,
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    },
  ]

  const ACTIONS = [
    {
      to: '/patient/book', label: 'Book Appointment', desc: 'Find & book a slot',
      color: 'rgba(167,139,250,0.9)', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', delay: 60,
      icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></>,
    },
    {
      to: '/patient/appointments', label: 'My Appointments', desc: 'View & manage bookings',
      color: 'rgba(52,211,153,0.9)', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', delay: 100,
      icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></>,
    },
    {
      to: '/providers', label: 'Find Providers', desc: 'Browse our network',
      color: 'rgba(129,140,248,0.9)', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', delay: 140,
      icon: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    },
    {
      to: '/settings/notifications', label: 'Notifications', desc: 'Email preferences',
      color: 'rgba(253,211,77,0.9)', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.18)', delay: 180,
      icon: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    },
  ]

  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb orb-1"/><div className="aurora-orb orb-2"/>
        <div className="aurora-orb orb-3"/><div className="aurora-orb orb-4"/>
        <div className="aurora-orb orb-5"/>
      </div>

      <div className="page-wrapper">
        <div className="page-container">

          {/* greeting */}
          <div style={{ marginBottom: 'var(--sp-7)', animation: 'slideInUp 0.4s var(--ease) both' }}>
            <h1 className="page-title" style={{ margin: 0 }}>{greeting}, {firstName}</h1>
            <p className="page-subtitle" style={{ margin: 'var(--sp-1) 0 0' }}>
              Here's an overview of your health appointments.
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-16)' }}>
              <Spinner size={32} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>

              {/* ── stats ─────────────────────────────────────────── */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
                {STATS.map(s => <StatTile key={s.label} {...s} />)}
              </div>

              {/* ── quick actions ─────────────────────────────────── */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-3)' }}>
                  Quick Actions
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
                  {ACTIONS.map(a => <ActionTile key={a.to} {...a} />)}
                </div>
              </div>

              {/* ── upcoming appointments ─────────────────────────── */}
              <div className="content-card" style={{ animation: 'slideInUp 0.4s var(--ease) 160ms both' }}>
                <SectionHeader
                  iconBg="rgba(139,92,246,0.15)" iconBorder="rgba(139,92,246,0.25)"
                  iconColor="rgba(167,139,250,0.9)"
                  iconPath={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
                  title="Upcoming Appointments"
                  linkTo="/patient/appointments" linkLabel="View all"
                />
                {upcoming.length === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--sp-8) 0' }}>
                    <div className="empty-state-icon">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div className="empty-state-title">No upcoming appointments</div>
                    <div className="empty-state-desc">Book with a provider to get started.</div>
                    <Link to="/patient/book" className="btn glass-btn-primary"
                      style={{ marginTop: 'var(--sp-4)', textDecoration: 'none' }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Book now
                    </Link>
                  </div>
                ) : (
                  upcoming.map((a, i) => <UpcomingRow key={a._id} appt={a} idx={i} />)
                )}
              </div>

              {/* ── recent visits ─────────────────────────────────── */}
              {recent.length > 0 && (
                <div className="content-card" style={{ animation: 'slideInUp 0.4s var(--ease) 220ms both' }}>
                  <SectionHeader
                    iconBg="rgba(16,185,129,0.12)" iconBorder="rgba(16,185,129,0.25)"
                    iconColor="rgba(52,211,153,0.9)"
                    iconPath={<polyline points="20 6 9 17 4 12"/>}
                    title="Recent Visits"
                    linkTo="/patient/appointments" linkLabel="View all"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--sp-3)' }}>
                    {recent.map((a, i) => {
                      const initials = a.provider?.name
                        ? a.provider.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                        : '?'
                      return (
                        <div key={a._id} style={{
                          padding: 'var(--sp-3) var(--sp-4)',
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 'var(--r-lg)', display: 'flex', gap: 'var(--sp-3)', alignItems: 'center',
                          animation: `slideInUp 0.4s var(--ease) ${260 + i * 50}ms both`,
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 800, color: 'white',
                          }}>
                            {a.provider?.avatarUrl
                              ? <img src={a.provider.avatarUrl} alt=""
                                     style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                     onError={e => { e.target.style.display = 'none' }} />
                              : initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {a.provider?.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                              {fmtDate(a.startTime)}
                            </div>
                          </div>
                          <StatusBadge status={a.status} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  )
}
