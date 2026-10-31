import { useState, useEffect, useCallback } from 'react'
import { appointmentService } from '../../services/appointmentService'
import { slotService } from '../../services/slotService'

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

/* ─── Toast ──────────────────────────────────────────────────────────── */
function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 4000); return () => clearTimeout(t) }, [onDismiss])
  const isSuccess = type === 'success'
  return (
    <div style={{
      position: 'fixed', bottom: 'var(--sp-6)', right: 'var(--sp-6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
      padding: 'var(--sp-3) var(--sp-5)',
      background: isSuccess ? 'rgba(16,185,129,0.18)' : 'rgba(220,38,38,0.18)',
      border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.4)' : 'rgba(248,113,113,0.4)'}`,
      borderRadius: 'var(--r-lg)', backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      color: isSuccess ? 'rgba(52,211,153,0.95)' : 'rgba(252,165,165,0.95)',
      fontSize: '0.9375rem', fontWeight: 500,
      animation: 'slideInUp 0.3s var(--ease)', maxWidth: 380,
    }}>
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        {isSuccess ? <polyline points="20 6 9 17 4 12"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
      </svg>
      {message}
      <button onClick={onDismiss} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, padding: 0 }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

/* ─── Cancel modal ───────────────────────────────────────────────────── */
function CancelModal({ appointment, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [submitting, setSub] = useState(false)
  const [error, setError]   = useState('')

  const handle = async () => {
    setSub(true); setError('')
    try {
      await appointmentService.cancel(appointment._id, { reason })
      onDone('Appointment cancelled successfully')
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
          <textarea className="form-textarea" rows={2} value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for cancellation…" />
        </div>
        <div className="modal-footer">
          <button className="glass-btn-ghost" onClick={onClose}>Keep it</button>
          <button
            className="glass-btn-primary"
            style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
            onClick={handle} disabled={submitting}
          >
            {submitting ? 'Cancelling…' : 'Yes, cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Provider reschedule modal ──────────────────────────────────────── */
function ProviderRescheduleModal({ appointment, onClose, onDone }) {
  const [slots, setSlots]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [selectedSlot, setSelected]   = useState(null)
  const [reason, setReason]           = useState('')
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting]   = useState(false)

  useEffect(() => {
    const from = new Date().toISOString()
    const to   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    slotService.getMine({ from, to, available: 'true' })
      .then(r => setSlots(r.data.data))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [])

  const grouped = slots.reduce((acc, s) => {
    const key = new Date(s.startTime).toDateString()
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const handle = async () => {
    if (!selectedSlot) return
    setServerError(''); setSubmitting(true)
    try {
      const result = await appointmentService.providerReschedule(appointment._id, {
        newSlotId: selectedSlot._id,
        reason,
      })
      onDone(`Appointment moved to ${fmtDate(result.data.data.startTime)} at ${fmtTime(result.data.data.startTime)}`)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Reschedule failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: 580, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <span className="modal-title">Propose New Time</span>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--sp-4)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--sp-3)' }}>
            Move <strong style={{ color: 'var(--text-primary)' }}>{appointment.patient.name}</strong>'s appointment to one of your open slots.
            The original appointment will be marked as rescheduled.
          </p>

          <div style={{ padding: 'var(--sp-3) var(--sp-4)', background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', borderRadius: 'var(--r-md)', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--sp-4)' }}>
            Current: <strong style={{ color: 'var(--text-primary)' }}>{fmtDate(appointment.startTime)}</strong> at{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{fmtTime(appointment.startTime)}</strong>
          </div>

          {serverError && (
            <div className="glass-alert" role="alert" style={{ marginBottom: 'var(--sp-4)' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {serverError}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-8)', opacity: 0.4 }}>
              <svg className="spin" width="24" height="24" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--sp-6)' }}>
              <div className="empty-state-title">No available slots</div>
              <div className="empty-state-desc">Add open slots first from the My Slots page.</div>
            </div>
          ) : (
            <div className="slot-picker-groups">
              {Object.keys(grouped).map(day => (
                <div key={day} className="slot-picker-group">
                  <div className="slot-picker-date">{fmtDate(new Date(day))}</div>
                  <div className="slot-picker-chips">
                    {grouped[day].map(s => (
                      <button
                        key={s._id}
                        className={`slot-picker-chip${selectedSlot?._id === s._id ? ' selected' : ''}`}
                        onClick={() => setSelected(s)}
                      >
                        <span className="slot-picker-time">{fmtTime(s.startTime)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="form-group" style={{ marginTop: 'var(--sp-4)' }}>
            <label className="form-label">
              Reason
              <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 'var(--sp-2)' }}>(optional)</span>
            </label>
            <textarea className="form-textarea" rows={2}
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Clinic schedule change, emergency…" />
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 'var(--sp-4)', marginTop: 0 }}>
          <button className="glass-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="glass-btn-primary" disabled={!selectedSlot || submitting} onClick={handle}>
            {submitting ? 'Proposing…' : 'Confirm New Time'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Appointment row ────────────────────────────────────────────────── */
function ApptRow({ appt, onRefresh, onToast, idx }) {
  const [showCancel, setShowCancel]           = useState(false)
  const [showReschedule, setShowReschedule]   = useState(false)
  const [completing, setCompleting]           = useState(false)
  const isActive = ['confirmed', 'pending'].includes(appt.status)

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await appointmentService.complete(appt._id)
      onToast('Appointment marked as completed', 'success')
      onRefresh()
    } catch (err) {
      onToast(err.response?.data?.message || 'Could not mark as completed', 'error')
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
              onClick={handleComplete} disabled={completing}
            >
              {completing ? 'Marking…' : 'Mark Completed'}
            </button>
            <button
              className="glass-btn-ghost"
              style={{ height: 32, fontSize: '0.8125rem', paddingInline: 'var(--sp-3)', gap: 'var(--sp-1)' }}
              onClick={() => setShowReschedule(true)}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.29"/>
              </svg>
              Propose New Time
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
          onDone={(msg) => { setShowCancel(false); onToast(msg, 'success'); onRefresh() }}
        />
      )}
      {showReschedule && (
        <ProviderRescheduleModal
          appointment={appt}
          onClose={() => setShowReschedule(false)}
          onDone={(msg) => { setShowReschedule(false); onToast(msg, 'success'); onRefresh() }}
        />
      )}
    </>
  )
}

/* ─── Stats bar ──────────────────────────────────────────────────────── */
function StatsBar({ stats }) {
  if (!stats) return null
  return (
    <div className="stat-grid" style={{ marginBottom: 'var(--sp-6)', animation: 'slideInUp 0.4s var(--ease) 60ms both' }}>
      {[
        { label: 'Upcoming',   value: stats.confirmed,          color: 'rgba(167,139,250,0.9)' },
        { label: 'Completed',  value: stats.completed,          color: 'rgba(52,211,153,0.9)'  },
        { label: 'Cancelled',  value: stats.cancelled,          color: 'rgba(252,165,165,0.8)' },
        { label: 'Cancel Rate',value: `${stats.cancellationRate}%`, color: stats.cancellationRate > 20 ? 'rgba(252,165,165,0.8)' : 'rgba(52,211,153,0.9)' },
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
  const [stats, setStats]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [statusFilter, setStatusFilter] = useState('upcoming')
  const [toast, setToast]               = useState(null)

  const loadStats = useCallback(() => {
    appointmentService.getStats()
      .then(r => setStats(r.data.data))
      .catch(() => {})
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (statusFilter === 'upcoming')   params.status = 'confirmed,pending'
    if (statusFilter === 'completed')  params.status = 'completed'
    if (statusFilter === 'cancelled')  params.status = 'cancelled'
    if (statusFilter === 'rescheduled') params.status = 'rescheduled'
    appointmentService.getProviderList(params)
      .then(r => setAppointments(r.data.data))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load(); loadStats() }, [load, loadStats])

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), [])

  const tabs = [
    { key: 'upcoming',    label: 'Upcoming'    },
    { key: 'rescheduled', label: 'Rescheduled' },
    { key: 'completed',   label: 'Completed'   },
    { key: 'cancelled',   label: 'Cancelled'   },
    { key: 'all',         label: 'All'         },
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
            <p className="page-subtitle">Manage patient appointments, propose new times, and track outcomes.</p>
          </div>

          <StatsBar stats={stats} />

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
                  {statusFilter === 'upcoming'
                    ? 'No upcoming appointments. Patients will appear here when they book a slot.'
                    : `No ${statusFilter} appointments found.`}
                </div>
              </div>
            </div>
          ) : (
            <div className="appt-list">
              {appointments.map((a, i) => (
                <ApptRow key={a._id} appt={a} onRefresh={load} onToast={showToast} idx={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </>
  )
}
