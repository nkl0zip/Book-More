import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
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

/* ─── Status badge ───────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending
  return (
    <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 4, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {status}
    </span>
  )
}

/* ─── Cancel modal ───────────────────────────────────────────────────── */
function CancelModal({ appointment, onClose, onDone }) {
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ mode: 'onTouched' })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await appointmentService.cancel(appointment._id, { reason: data.reason || '' })
      onDone()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Cancellation failed. Please try again.')
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--sp-5)' }}>
          Cancel your appointment with <strong style={{ color: 'var(--text-primary)' }}>{appointment.provider.name}</strong> on{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{fmtDate(appointment.startTime)}</strong>?
        </p>

        {serverError && (
          <div className="glass-alert" role="alert" style={{ marginBottom: 'var(--sp-4)' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group" style={{ marginBottom: 'var(--sp-5)' }}>
            <label className="form-label" htmlFor="cn-reason">
              Reason
              <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 'var(--sp-2)' }}>(optional)</span>
            </label>
            <textarea
              id="cn-reason"
              className="form-textarea"
              placeholder="Let the provider know why you're cancelling…"
              rows={2}
              {...register('reason', { maxLength: { value: 300, message: 'Max 300 characters' } })}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="glass-btn-ghost" onClick={onClose}>Keep it</button>
            <button
              type="submit"
              className="glass-btn-primary"
              style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Cancelling…' : 'Yes, cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Reschedule modal ───────────────────────────────────────────────── */
function RescheduleModal({ appointment, onClose, onDone }) {
  const [slots, setSlots]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [selectedSlot, setSelected] = useState(null)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register, getValues }     = useForm({ mode: 'onTouched', defaultValues: { notes: appointment.notes || '' } })

  useEffect(() => {
    const from = new Date().toISOString()
    const to   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    slotService.getByProvider(appointment.provider._id, { from, to, available: 'true' })
      .then(r => setSlots(r.data.data))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [appointment.provider._id])

  const grouped = slots.reduce((acc, s) => {
    const key = new Date(s.startTime).toDateString()
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const handleReschedule = async () => {
    if (!selectedSlot) return
    setServerError('')
    setSubmitting(true)
    try {
      await appointmentService.reschedule(appointment._id, {
        newSlotId: selectedSlot._id,
        notes: getValues('notes') || '',
      })
      onDone()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Reschedule failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: 580, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <span className="modal-title">Reschedule Appointment</span>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--sp-4)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--sp-4)' }}>
            Pick a new slot with <strong style={{ color: 'var(--text-primary)' }}>{appointment.provider.name}</strong>.
          </p>

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
              <div className="empty-state-desc">This provider has no open slots in the next 30 days.</div>
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
            <label className="form-label" htmlFor="rs-notes">
              Notes
              <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 'var(--sp-2)' }}>(optional)</span>
            </label>
            <textarea id="rs-notes" className="form-textarea" rows={2} {...register('notes')} />
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 'var(--sp-4)', marginTop: 0 }}>
          <button className="glass-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="glass-btn-primary"
            disabled={!selectedSlot || submitting}
            onClick={handleReschedule}
          >
            {submitting ? 'Rescheduling…' : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Appointment card ───────────────────────────────────────────────── */
function AppointmentCard({ appointment, onRefresh }) {
  const [showCancel, setShowCancel]         = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)

  const isActive     = ['confirmed', 'pending'].includes(appointment.status)
  const isPast       = new Date(appointment.startTime) < new Date()
  const oneHourAhead = new Date(Date.now() + 60 * 60 * 1000)
  const canCancel    = isActive && new Date(appointment.startTime) > oneHourAhead
  const canReschedule = isActive && new Date(appointment.startTime) > oneHourAhead

  return (
    <div className={`appt-card${!isActive ? ' dim' : ''}`} style={{ animationDelay: '0ms' }}>
      <div className="appt-card-header">
        <div className="appt-provider-info">
          <div className="appt-avatar">
            {appointment.provider.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
          </div>
          <div>
            <div className="appt-provider-name">{appointment.provider.name}</div>
            {appointment.provider.specialisation && (
              <div className="appt-provider-spec">{appointment.provider.specialisation}</div>
            )}
          </div>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="appt-datetime">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{fmtDate(appointment.startTime)}</span>
        <span style={{ color: 'var(--text-tertiary)' }}>·</span>
        <span>{fmtTime(appointment.startTime)} – {fmtTime(appointment.endTime)}</span>
      </div>

      {appointment.service && (
        <div style={{ marginTop: 'var(--sp-2)' }}>
          <span className="slot-service-tag">{appointment.service.name}</span>
        </div>
      )}

      {appointment.notes && (
        <p style={{ marginTop: 'var(--sp-3)', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "{appointment.notes}"
        </p>
      )}

      {appointment.cancellationReason && (
        <p style={{ marginTop: 'var(--sp-2)', fontSize: '0.8125rem', color: 'rgba(252,165,165,0.7)' }}>
          Reason: {appointment.cancellationReason}
        </p>
      )}

      {canCancel && (
        <div className="appt-actions">
          {canReschedule && (
            <button
              className="glass-btn-ghost"
              style={{ height: 32, fontSize: '0.8125rem', paddingInline: 'var(--sp-3)' }}
              onClick={() => setShowReschedule(true)}
            >
              Reschedule
            </button>
          )}
          <button
            className="glass-btn-ghost"
            style={{ height: 32, fontSize: '0.8125rem', paddingInline: 'var(--sp-3)', color: 'rgba(252,165,165,0.8)', borderColor: 'rgba(248,113,113,0.25)' }}
            onClick={() => setShowCancel(true)}
          >
            Cancel
          </button>
        </div>
      )}

      {isPast && appointment.status === 'confirmed' && (
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Past appointment — awaiting completion mark from provider</span>
        </div>
      )}

      {showCancel && (
        <CancelModal
          appointment={appointment}
          onClose={() => setShowCancel(false)}
          onDone={() => { setShowCancel(false); onRefresh() }}
        />
      )}
      {showReschedule && (
        <RescheduleModal
          appointment={appointment}
          onClose={() => setShowReschedule(false)}
          onDone={() => { setShowReschedule(false); onRefresh() }}
        />
      )}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [statusFilter, setStatusFilter] = useState('active')

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (statusFilter === 'active')    params.status = 'confirmed'
    if (statusFilter === 'completed') params.status = 'completed'
    if (statusFilter === 'cancelled') params.status = 'cancelled'
    appointmentService.getMine(params)
      .then(r => setAppointments(r.data.data))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false))
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
            <p className="page-subtitle">View, reschedule, or cancel your booked appointments.</p>
          </div>

          <div className="glass-tabs" style={{ animation: 'slideInUp 0.4s var(--ease) 60ms both' }}>
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
                    ? 'You have no upcoming appointments. Book one now!'
                    : `No ${statusFilter} appointments found.`}
                </div>
              </div>
            </div>
          ) : (
            <div className="appt-list">
              {appointments.map((a, i) => (
                <AppointmentCard
                  key={a._id}
                  appointment={a}
                  onRefresh={load}
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
