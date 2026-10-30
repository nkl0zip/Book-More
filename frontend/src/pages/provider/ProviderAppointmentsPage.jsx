import { useState, useEffect, useCallback } from 'react'
import { appointmentService } from '../../services/appointmentService'

/* ─── Helpers ────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

const STATUS_COLORS = {
  confirmed:   { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)',  text: 'rgba(167,139,250,0.9)' },
  pending:     { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', text: 'rgba(253,211,77,0.9)'  },
  cancelled:   { bg: 'rgba(220,38,38,0.12)',  border: 'rgba(248,113,113,0.25)', text: 'rgba(252,165,165,0.9)' },
  completed:   { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: 'rgba(52,211,153,0.9)'  },
  rescheduled: { bg: 'rgba(107,114,128,0.15)',border: 'rgba(107,114,128,0.25)',text: 'rgba(156,163,175,0.9)' },
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending
  return (
    <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 4, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {status}
    </span>
  )
}

/* ─── Cancel modal (provider) ────────────────────────────────────────── */
function CancelModal({ appointment, onClose, onDone }) {
  const [reason, setReason]   = useState('')
  const [submitting, setSub]  = useState(false)
  const [error, setError]     = useState('')

  const handle = async () => {
    setSub(true); setError('')
    try {
      await appointmentService.cancel(appointment._id, { reason })
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel.')
      setSub(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card danger">
        <div className="modal-danger-icon">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div className="modal-title" style={{ marginBottom: 'var(--sp-2)' }}>Cancel Appointment</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--sp-4)', fontSize: '0.9375rem' }}>
          Cancel the appointment with <strong style={{ color: 'var(--text-primary)' }}>{appointment.patient.name}</strong> on{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{fmtDate(appointment.startTime)}</strong>?
        </p>
        {error && <div className="glass-alert" style={{ marginBottom: 'var(--sp-3)' }}>{error}</div>}
        <div className="form-group" style={{ marginBottom: 'var(--sp-5)' }}>
          <label className="form-label">Reason (optional)</label>
          <textarea className="form-textarea" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for cancellation…" />
        </div>
        <div className="modal-footer">
          <button className="glass-btn-ghost" onClick={onClose}>Keep it</button>
          <button
            className="glass-btn-primary"
            style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
            onClick={handle}
            disabled={submitting}
          >
            {submitting ? 'Cancelling…' : 'Yes, cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Appointment row ────────────────────────────────────────────────── */
function ApptRow({ appt, onRefresh, idx }) {
  const [showCancel, setShowCancel] = useState(false)
  const [completing, setCompleting] = useState(false)
  const isActive = ['confirmed', 'pending'].includes(appt.status)

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await appointmentService.complete(appt._id)
      onRefresh()
    } catch {
      setCompleting(false)
    }
  }

  return (
    <>
      <div className={`appt-card${!isActive ? ' dim' : ''}`} style={{ animationDelay: `${idx * 40}ms` }}>
        <div className="appt-card-header">
          <div className="appt-provider-info">
            <div className="appt-avatar">
              {appt.patient.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
            </div>
            <div>
              <div className="appt-provider-name">{appt.patient.name}</div>
              {appt.patient.email && <div className="appt-provider-spec">{appt.patient.email}</div>}
            </div>
          </div>
          <StatusBadge status={appt.status} />
        </div>

        <div className="appt-datetime">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{fmtDate(appt.startTime)}</span>
          <span style={{ color: 'var(--text-tertiary)' }}>·</span>
          <span>{fmtTime(appt.startTime)} – {fmtTime(appt.endTime)}</span>
        </div>

        {appt.service && (
          <div style={{ marginTop: 'var(--sp-2)' }}>
            <span className="slot-service-tag">{appt.service.name}</span>
          </div>
        )}

        {appt.notes && (
          <p style={{ marginTop: 'var(--sp-3)', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            Patient note: "{appt.notes}"
          </p>
        )}

        {appt.cancellationReason && (
          <p style={{ marginTop: 'var(--sp-2)', fontSize: '0.8125rem', color: 'rgba(252,165,165,0.7)' }}>
            Reason: {appt.cancellationReason}
          </p>
        )}

        {isActive && (
          <div className="appt-actions">
            <button
              className="glass-btn-primary"
              style={{ height: 32, fontSize: '0.8125rem', paddingInline: 'var(--sp-3)', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', boxShadow: 'none', color: 'rgba(52,211,153,0.9)' }}
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? 'Marking…' : 'Mark Completed'}
            </button>
            <button
              className="glass-btn-ghost"
              style={{ height: 32, fontSize: '0.8125rem', paddingInline: 'var(--sp-3)', color: 'rgba(252,165,165,0.8)', borderColor: 'rgba(248,113,113,0.25)' }}
              onClick={() => setShowCancel(true)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {showCancel && (
        <CancelModal
          appointment={appt}
          onClose={() => setShowCancel(false)}
          onDone={() => { setShowCancel(false); onRefresh() }}
        />
      )}
    </>
  )
}

/* ─── Stats bar ──────────────────────────────────────────────────────── */
function StatsBar({ appointments }) {
  const confirmed  = appointments.filter(a => a.status === 'confirmed').length
  const completed  = appointments.filter(a => a.status === 'completed').length
  const cancelled  = appointments.filter(a => a.status === 'cancelled').length

  return (
    <div className="stat-grid" style={{ marginBottom: 'var(--sp-6)', animation: 'slideInUp 0.4s var(--ease) 60ms both' }}>
      {[
        { label: 'Upcoming',  value: confirmed,  color: 'rgba(167,139,250,0.9)' },
        { label: 'Completed', value: completed,  color: 'rgba(52,211,153,0.9)'  },
        { label: 'Cancelled', value: cancelled,  color: 'rgba(252,165,165,0.8)' },
        { label: 'Total',     value: appointments.length, color: 'var(--text-primary)' },
      ].map(s => (
        <div key={s.label} className="stat-card">
          <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function ProviderAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [allAppts, setAllAppts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [statusFilter, setStatusFilter] = useState('active')

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (statusFilter === 'active')    params.status = 'confirmed'
    if (statusFilter === 'completed') params.status = 'completed'
    if (statusFilter === 'cancelled') params.status = 'cancelled'
    Promise.all([
      appointmentService.getProviderList(params),
      appointmentService.getProviderList({ limit: 200 }),
    ]).then(([filtered, all]) => {
      setAppointments(filtered.data.data)
      setAllAppts(all.data.data)
    }).catch(() => {
      setAppointments([])
      setAllAppts([])
    }).finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const tabs = [
    { key: 'active',    label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'all',       label: 'All' },
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
          <div className="page-header">
            <h1 className="page-title">My Appointments</h1>
            <p className="page-subtitle">Manage patient appointments, mark completions, and cancel if needed.</p>
          </div>

          <StatsBar appointments={allAppts} />

          <div className="glass-tabs" style={{ animation: 'slideInUp 0.4s var(--ease) 80ms both' }}>
            {tabs.map(t => (
              <button
                key={t.key}
                className={`glass-tab${statusFilter === t.key ? ' active' : ''}`}
                onClick={() => setStatusFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-12)', opacity: 0.4 }}>
              <svg className="spin" width="28" height="28" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
            </div>
          ) : appointments.length === 0 ? (
            <div className="content-card" style={{ animation: 'slideInUp 0.4s var(--ease) 120ms both' }}>
              <div className="empty-state" style={{ padding: 'var(--sp-10)' }}>
                <div className="empty-state-icon">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div className="empty-state-title">No appointments here</div>
                <div className="empty-state-desc">
                  {statusFilter === 'active'
                    ? 'No upcoming appointments. Patients will appear here when they book a slot.'
                    : `No ${statusFilter} appointments found.`}
                </div>
              </div>
            </div>
          ) : (
            <div className="appt-list">
              {appointments.map((a, i) => (
                <ApptRow key={a._id} appt={a} onRefresh={load} idx={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
