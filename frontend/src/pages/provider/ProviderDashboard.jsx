import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { dashboardService } from '../../services/dashboardService'

/* ─── Format helpers ─────────────────────────────────────────────────────── */
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtDateShort = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, color, delay = 0 }) {
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 'var(--sp-3)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--r-md)',
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
      </div>
      <div className="stat-value" style={{ color, fontSize: '2rem', lineHeight: 1, marginBottom: 'var(--sp-1)' }}>
        {value}
      </div>
      <div className="stat-label" style={{ marginBottom: sub ? 'var(--sp-1)' : 0 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{sub}</div>}
    </div>
  )
}

/* ─── Weekly calendar strip ──────────────────────────────────────────────── */
function WeekStrip({ weekSchedule, selectedDay, onSelect }) {
  if (!weekSchedule?.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 'var(--sp-2)' }}>
      {weekSchedule.map((day, i) => {
        const isSelected = selectedDay === i
        const hasBusy = day.bookedCount > 0
        const hasOpen = day.availableCount > 0
        return (
          <button
            key={day.date}
            onClick={() => onSelect(isSelected ? null : i)}
            style={{
              background: isSelected
                ? 'rgba(139,92,246,0.2)'
                : day.isToday
                  ? 'rgba(139,92,246,0.1)'
                  : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isSelected ? 'rgba(139,92,246,0.5)' : day.isToday ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 'var(--r-md)',
              padding: 'var(--sp-3) var(--sp-2)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-1)',
              transition: 'all 0.2s var(--ease)',
            }}
          >
            <span style={{ fontSize: '0.6875rem', color: day.isToday ? 'rgba(139,92,246,0.9)' : 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {day.dayLabel}
            </span>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: isSelected ? 'rgba(167,139,250,1)' : day.isToday ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1 }}>
              {day.dateNum}
            </span>
            {/* Dot indicators */}
            <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
              {hasBusy && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(139,92,246,0.8)' }}/>}
              {hasOpen && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(16,185,129,0.7)' }}/>}
              {!hasBusy && !hasOpen && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }}/>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Day detail panel (shows below week strip when a day is selected) ───── */
function DayDetail({ day }) {
  if (!day) return null
  const isEmpty = day.appointments.length === 0 && day.slotCount === 0
  return (
    <div style={{
      marginTop: 'var(--sp-4)',
      padding: 'var(--sp-4)',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 'var(--r-md)',
      animation: 'slideInUp 0.25s var(--ease)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
            {new Date(day.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {day.bookedCount > 0 && (
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: 'rgba(167,139,250,0.9)' }}>
              {day.bookedCount} booked
            </span>
          )}
          {day.availableCount > 0 && (
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'rgba(52,211,153,0.9)' }}>
              {day.availableCount} open
            </span>
          )}
        </div>
      </div>
      {isEmpty ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--sp-4) 0' }}>
          No slots or appointments on this day.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {day.appointments.map((a) => (
            <div key={a._id} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
              padding: 'var(--sp-3)',
              background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
              borderRadius: 'var(--r-sm)',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(167,139,250,0.9)', flexShrink: 0 }}>
                {initials(a.patient?.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.patient?.name || 'Patient'}
                </div>
                {a.service && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{a.service.name}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(167,139,250,0.9)' }}>
                  {fmtTime(a.startTime)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {fmtTime(a.endTime)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Upcoming appointments list ─────────────────────────────────────────── */
function UpcomingAppts({ appts }) {
  if (!appts?.length) {
    return (
      <div className="empty-state" style={{ padding: 'var(--sp-8)' }}>
        <div className="empty-state-icon">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div className="empty-state-title">No upcoming appointments</div>
        <div className="empty-state-desc">Your confirmed appointments will appear here.</div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {appts.map((a, i) => (
        <div key={a._id} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
          padding: 'var(--sp-4) 0',
          borderBottom: i < appts.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          animation: `slideInUp 0.4s var(--ease) ${i * 50}ms both`,
        }}>
          {/* Avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(167,139,250,0.9)',
          }}>
            {initials(a.patient?.name)}
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.patient?.name || 'Patient'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {a.service?.name || 'Appointment'}{a.patient?.email ? ` · ${a.patient.email}` : ''}
            </div>
          </div>
          {/* Date/time */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(167,139,250,0.9)' }}>
              {fmtDateShort(a.startTime)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {fmtTime(a.startTime)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Recent patients ────────────────────────────────────────────────────── */
function RecentPatients({ patients }) {
  if (!patients?.length) {
    return (
      <div className="empty-state" style={{ padding: 'var(--sp-6)' }}>
        <div className="empty-state-title" style={{ fontSize: '0.875rem' }}>No patients yet</div>
        <div className="empty-state-desc">Patients will appear here once they book with you.</div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {patients.map((p, i) => (
        <div key={p.patientId} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
          padding: 'var(--sp-3) 0',
          borderBottom: i < patients.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          animation: `slideInUp 0.4s var(--ease) ${i * 50}ms both`,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: 'rgba(45,212,191,0.9)',
          }}>
            {initials(p.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.email}
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0, textAlign: 'right' }}>
            {fmtDateShort(p.lastAppt)}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Service breakdown bar chart ────────────────────────────────────────── */
function ServiceBreakdown({ services }) {
  if (!services?.length) {
    return (
      <div className="empty-state" style={{ padding: 'var(--sp-6)' }}>
        <div className="empty-state-title" style={{ fontSize: '0.875rem' }}>No service data</div>
        <div className="empty-state-desc">Book appointments with services to see the breakdown.</div>
      </div>
    )
  }
  const maxCount = Math.max(...services.map(s => s.count), 1)
  const BAR_COLORS = [
    'rgba(139,92,246,0.7)',
    'rgba(99,102,241,0.7)',
    'rgba(20,184,166,0.7)',
    'rgba(244,63,94,0.6)',
    'rgba(251,191,36,0.6)',
    'rgba(168,85,247,0.6)',
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      {services.map((s, i) => (
        <div key={s.serviceId || i} style={{ animation: `slideInUp 0.4s var(--ease) ${i * 60}ms both` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-1)' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
              {s.name}
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: BAR_COLORS[i % BAR_COLORS.length] }}>
              {s.count}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(s.count / maxCount) * 100}%`,
              borderRadius: 3,
              background: BAR_COLORS[i % BAR_COLORS.length],
              transition: 'width 0.8s var(--ease)',
            }}/>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Slot fill gauge ─────────────────────────────────────────────────────── */
function SlotGauge({ slotSummary }) {
  if (!slotSummary) return null
  const { open, booked, total } = slotSummary
  const pct = total > 0 ? Math.round((booked / total) * 100) : 0
  const circumference = 2 * Math.PI * 36
  const dashoffset = circumference * (1 - pct / 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-6)' }}>
      {/* SVG donut */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10"/>
          <circle
            cx="45" cy="45" r="36" fill="none"
            stroke="rgba(139,92,246,0.75)" strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            transform="rotate(-90 45 45)"
            style={{ transition: 'stroke-dashoffset 1s var(--ease)' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgba(167,139,250,0.95)', lineHeight: 1 }}>{pct}%</span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: 2 }}>filled</span>
        </div>
      </div>
      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {[
          { label: 'Booked', value: booked, color: 'rgba(139,92,246,0.8)' },
          { label: 'Available', value: open, color: 'rgba(16,185,129,0.8)' },
          { label: 'Total (30 days)', value: total, color: 'rgba(255,255,255,0.3)' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }}/>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function ProviderDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)  // index into weekSchedule

  const load = useCallback(() => {
    setLoading(true)
    dashboardService.getProviderDashboard()
      .then(r => { setData(r.data.data); setError(null) })
      .catch(err => setError(err.response?.data?.message || 'Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const stats = data?.stats
  const statCards = [
    {
      label: 'Today',
      value: loading ? '—' : (stats?.today ?? 0),
      sub: 'appointments',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      color: 'rgba(167,139,250,0.9)',
      delay: 0,
    },
    {
      label: 'This Week',
      value: loading ? '—' : (stats?.thisWeek ?? 0),
      sub: 'upcoming',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
        </svg>
      ),
      color: 'rgba(99,102,241,0.9)',
      delay: 60,
    },
    {
      label: 'Completed',
      value: loading ? '—' : (stats?.completed ?? 0),
      sub: 'all time',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      color: 'rgba(52,211,153,0.9)',
      delay: 120,
    },
    {
      label: 'Cancel Rate',
      value: loading ? '—' : `${stats?.cancellationRate ?? 0}%`,
      sub: 'all time',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      ),
      color: stats?.cancellationRate > 20 ? 'rgba(248,113,113,0.9)' : 'rgba(251,191,36,0.8)',
      delay: 180,
    },
  ]

  return (
    <>
      {/* Aurora background */}
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb orb-1"/><div className="aurora-orb orb-2"/>
        <div className="aurora-orb orb-3"/><div className="aurora-orb orb-4"/>
        <div className="aurora-orb orb-5"/>
      </div>

      <div className="page-wrapper">
        <div className="page-container" style={{ maxWidth: 1100 }}>

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 'var(--sp-4)',
            marginBottom: 'var(--sp-6)',
            animation: 'slideInUp 0.35s var(--ease) both',
          }}>
            <div>
              <h1 className="page-title" style={{ marginBottom: 'var(--sp-1)' }}>
                Welcome back, {user?.name?.split(' ')[0] || 'Doctor'} 👋
              </h1>
              <p className="page-subtitle">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              <Link to="/provider/slots" className="glass-btn-primary" style={{ height: 38, fontSize: '0.875rem' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 'var(--sp-2)' }}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Slots
              </Link>
              <button onClick={load} className="glass-btn-ghost" style={{ height: 38, fontSize: '0.875rem', width: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={loading ? { animation: 'spin 0.8s linear infinite' } : {}}>
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.29"/>
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="glass-alert" style={{ marginBottom: 'var(--sp-5)' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* ── Stats row ─────────────────────────────────────────────────── */}
          <div className="stat-grid" style={{ marginBottom: 'var(--sp-6)' }}>
            {statCards.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* ── Main 2-column grid ─────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--sp-5)',
          }}>

            {/* ── Weekly schedule ──────────────────────────────────────────── */}
            <div className="content-card" style={{ gridColumn: '1 / -1', animation: 'slideInUp 0.4s var(--ease) 200ms both' }}>
              <div className="content-card-header" style={{ marginBottom: 'var(--sp-5)' }}>
                <span className="content-card-title">This Week</span>
                <Link to="/provider/appointments" className="glass-btn-ghost" style={{ height: 30, fontSize: '0.8125rem', padding: '0 var(--sp-3)' }}>
                  View all
                </Link>
              </div>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-8)', opacity: 0.4 }}>
                  <svg className="spin" width="24" height="24" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                </div>
              ) : (
                <>
                  <WeekStrip
                    weekSchedule={data?.weekSchedule}
                    selectedDay={selectedDay}
                    onSelect={setSelectedDay}
                  />
                  <DayDetail
                    day={selectedDay !== null ? data?.weekSchedule?.[selectedDay] : null}
                  />
                  {selectedDay === null && data?.weekSchedule && (
                    <p style={{ marginTop: 'var(--sp-3)', fontSize: '0.8125rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                      Click a day to see its appointments
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ── Upcoming appointments ──────────────────────────────────── */}
            <div className="content-card" style={{ animation: 'slideInUp 0.4s var(--ease) 240ms both' }}>
              <div className="content-card-header" style={{ marginBottom: 'var(--sp-4)' }}>
                <span className="content-card-title">Upcoming Appointments</span>
                <Link to="/provider/appointments" className="glass-btn-ghost" style={{ height: 30, fontSize: '0.8125rem', padding: '0 var(--sp-3)' }}>
                  All
                </Link>
              </div>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-8)', opacity: 0.4 }}>
                  <svg className="spin" width="20" height="20" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                </div>
              ) : (
                <UpcomingAppts appts={data?.upcomingAppts} />
              )}
            </div>

            {/* ── Recent patients ───────────────────────────────────────── */}
            <div className="content-card" style={{ animation: 'slideInUp 0.4s var(--ease) 280ms both' }}>
              <div className="content-card-header" style={{ marginBottom: 'var(--sp-4)' }}>
                <span className="content-card-title">Recent Patients</span>
              </div>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-8)', opacity: 0.4 }}>
                  <svg className="spin" width="20" height="20" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                </div>
              ) : (
                <RecentPatients patients={data?.recentPatients} />
              )}
            </div>

            {/* ── Service breakdown ─────────────────────────────────────── */}
            <div className="content-card" style={{ animation: 'slideInUp 0.4s var(--ease) 320ms both' }}>
              <div className="content-card-header" style={{ marginBottom: 'var(--sp-4)' }}>
                <span className="content-card-title">Services (30 days)</span>
                <Link to="/provider/services" className="glass-btn-ghost" style={{ height: 30, fontSize: '0.8125rem', padding: '0 var(--sp-3)' }}>
                  Manage
                </Link>
              </div>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-8)', opacity: 0.4 }}>
                  <svg className="spin" width="20" height="20" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                </div>
              ) : (
                <ServiceBreakdown services={data?.serviceBreakdown} />
              )}
            </div>

            {/* ── Slot fill gauge ───────────────────────────────────────── */}
            <div className="content-card" style={{ animation: 'slideInUp 0.4s var(--ease) 360ms both' }}>
              <div className="content-card-header" style={{ marginBottom: 'var(--sp-5)' }}>
                <span className="content-card-title">Slot Utilisation (30 days)</span>
                <Link to="/provider/slots" className="glass-btn-ghost" style={{ height: 30, fontSize: '0.8125rem', padding: '0 var(--sp-3)' }}>
                  Manage
                </Link>
              </div>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-8)', opacity: 0.4 }}>
                  <svg className="spin" width="20" height="20" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                </div>
              ) : (
                <SlotGauge slotSummary={data?.slotSummary} />
              )}
            </div>

            {/* ── Quick actions ─────────────────────────────────────────── */}
            <div className="content-card" style={{ gridColumn: '1 / -1', animation: 'slideInUp 0.4s var(--ease) 400ms both' }}>
              <div className="content-card-header" style={{ marginBottom: 'var(--sp-5)' }}>
                <span className="content-card-title">Quick Actions</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--sp-3)' }}>
                {[
                  { to: '/provider/slots',        label: 'Add Slots',       icon: <path d="M8 6h13M8 12h9m-9 6h13M3 6h.01M3 12h.01M3 18h.01"/>, color: 'rgba(139,92,246,0.8)' },
                  { to: '/provider/appointments', label: 'Appointments',    icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, color: 'rgba(99,102,241,0.8)' },
                  { to: '/provider/services',     label: 'My Services',     icon: <><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="2"/></>, color: 'rgba(20,184,166,0.8)' },
                  { to: '/provider/profile',      label: 'Edit Profile',    icon: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>, color: 'rgba(251,191,36,0.7)' },
                  { to: '/settings/notifications',label: 'Notifications',   icon: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>, color: 'rgba(244,63,94,0.7)' },
                ].map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                      padding: 'var(--sp-4)',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 'var(--r-md)',
                      color: 'var(--text-secondary)', textDecoration: 'none',
                      fontSize: '0.875rem', fontWeight: 500,
                      transition: 'all 0.2s var(--ease)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: `${action.color}18`, border: `1px solid ${action.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color, flexShrink: 0 }}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {action.icon}
                      </svg>
                    </div>
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>

          </div>{/* end 2-col grid */}
        </div>
      </div>
    </>
  )
}
