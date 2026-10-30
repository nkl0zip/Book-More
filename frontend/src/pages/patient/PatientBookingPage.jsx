import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import { slotService } from '../../services/slotService'
import { appointmentService } from '../../services/appointmentService'

/* ─── Helpers ────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const fmtDuration = (mins) =>
  mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}min` : ''}`

/* ─── Icons ──────────────────────────────────────────────────────────── */
const IconSearch = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconChevLeft = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconCheck = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ─── Step indicator ─────────────────────────────────────────────────── */
function StepBar({ step }) {
  const steps = ['Choose Provider', 'Pick a Slot', 'Confirm']
  return (
    <div className="booking-steps">
      {steps.map((label, i) => (
        <div key={i} className={`booking-step${step === i ? ' active' : ''}${step > i ? ' done' : ''}`}>
          <div className="booking-step-num">
            {step > i ? <IconCheck /> : <span>{i + 1}</span>}
          </div>
          <span className="booking-step-label">{label}</span>
          {i < steps.length - 1 && <div className="booking-step-line" />}
        </div>
      ))}
    </div>
  )
}

/* ─── Step 0 — Provider selection ───────────────────────────────────── */
function PickProvider({ onSelect }) {
  const [providers, setProviders] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    api.get('/providers')
      .then(r => setProviders(r.data.data))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = providers.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.specialisation || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 'var(--sp-6)' }}>
        <span style={{ position: 'absolute', left: 'var(--sp-4)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
          <IconSearch />
        </span>
        <input
          type="search"
          className="search-input"
          placeholder="Search by name or specialisation…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 'var(--sp-10)' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-12)', opacity: 0.4 }}>
          <svg className="spin" width="28" height="28" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><IconSearch /></div>
          <div className="empty-state-title">No providers found</div>
          <div className="empty-state-desc">Try a different search term.</div>
        </div>
      ) : (
        <div className="provider-grid">
          {filtered.map(p => (
            <div key={p._id} className="provider-card" onClick={() => onSelect(p)} style={{ cursor: 'pointer' }}>
              <div className="provider-avatar">{p.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}</div>
              <div className="provider-info">
                <div className="provider-name">{p.name}</div>
                {p.specialisation && <div className="provider-spec">{p.specialisation}</div>}
                {p.bio && <div className="provider-bio">{p.bio.slice(0, 80)}{p.bio.length > 80 ? '…' : ''}</div>}
              </div>
              <button className="glass-btn-primary" style={{ marginTop: 'var(--sp-4)', width: '100%' }}>
                Select
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Step 1 — Slot selection ────────────────────────────────────────── */
function PickSlot({ provider, onSelect, onBack }) {
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d
  })

  const load = useCallback(() => {
    setLoading(true)
    const from = fromDate.toISOString()
    const to   = new Date(fromDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
    slotService.getByProvider(provider._id, { from, to, available: 'true' })
      .then(r => setSlots(r.data.data))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [provider._id, fromDate])

  useEffect(() => { load() }, [load])

  const grouped = slots.reduce((acc, s) => {
    const key = new Date(s.startTime).toDateString()
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})
  const groupKeys = Object.keys(grouped)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)', flexWrap: 'wrap' }}>
        <div className="provider-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-3) var(--sp-4)', flex: 1 }}>
          <div className="provider-avatar" style={{ width: 36, height: 36, fontSize: '0.875rem', flexShrink: 0 }}>
            {provider.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
          </div>
          <div>
            <div className="provider-name" style={{ fontSize: '0.9375rem' }}>{provider.name}</div>
            {provider.specialisation && <div className="provider-spec" style={{ fontSize: '0.8125rem' }}>{provider.specialisation}</div>}
          </div>
        </div>
        <button className="glass-btn-ghost" style={{ height: 36, gap: 'var(--sp-2)', flexShrink: 0 }} onClick={onBack}>
          <IconChevLeft /> Change provider
        </button>
      </div>

      {/* Date range nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
        <button
          className="glass-btn-ghost"
          style={{ height: 34, paddingInline: 'var(--sp-3)', fontSize: '0.8125rem' }}
          onClick={() => setFromDate(d => { const n = new Date(d); n.setDate(n.getDate()-14); return n })}
          disabled={fromDate <= new Date()}
        >← Earlier</button>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flex: 1, textAlign: 'center' }}>
          Next 14 days from {fromDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
        <button
          className="glass-btn-ghost"
          style={{ height: 34, paddingInline: 'var(--sp-3)', fontSize: '0.8125rem' }}
          onClick={() => setFromDate(d => { const n = new Date(d); n.setDate(n.getDate()+14); return n })}
        >Later →</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-10)', opacity: 0.4 }}>
          <svg className="spin" width="28" height="28" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
          </svg>
        </div>
      ) : groupKeys.length === 0 ? (
        <div className="content-card">
          <div className="empty-state" style={{ padding: 'var(--sp-8)' }}>
            <div className="empty-state-icon"><IconCalendar /></div>
            <div className="empty-state-title">No available slots</div>
            <div className="empty-state-desc">This provider has no open slots in this period. Try navigating to a later date.</div>
          </div>
        </div>
      ) : (
        <div className="slot-picker-groups">
          {groupKeys.map(day => (
            <div key={day} className="slot-picker-group">
              <div className="slot-picker-date">{fmtDate(new Date(day))}</div>
              <div className="slot-picker-chips">
                {grouped[day].map(s => (
                  <button
                    key={s._id}
                    className="slot-picker-chip"
                    onClick={() => onSelect(s)}
                    title={s.service ? s.service.name : 'Any service'}
                  >
                    <span className="slot-picker-time">{fmtTime(s.startTime)}</span>
                    {s.service && <span className="slot-picker-svc">{s.service.name}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Step 2 — Confirm ───────────────────────────────────────────────── */
function ConfirmBooking({ provider, slot, onBack, onBooked }) {
  const [serverError, setServerError]   = useState('')
  const [services, setServices]         = useState([])
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    mode: 'onTouched',
    defaultValues: { serviceId: slot.service?._id ?? '', notes: '' },
  })

  useEffect(() => {
    api.get('/services', { params: { providerId: provider._id, active: 'true' } })
      .then(r => setServices(r.data.data))
      .catch(() => setServices([]))
  }, [provider._id])

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const payload = {
        slotId: slot._id,
        serviceId: data.serviceId || null,
        notes: data.notes || '',
      }
      const res = await appointmentService.book(payload)
      onBooked(res.data.data)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Booking failed. Please try again.')
    }
  }

  return (
    <div>
      <button className="glass-btn-ghost" style={{ height: 34, gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)', fontSize: '0.8125rem' }} onClick={onBack}>
        <IconChevLeft /> Back to slots
      </button>

      {/* Summary card */}
      <div className="content-card" style={{ marginBottom: 'var(--sp-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-1)' }}>Provider</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{provider.name}</div>
            {provider.specialisation && <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{provider.specialisation}</div>}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-1)' }}>Date &amp; Time</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmtDate(slot.startTime)}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}</div>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="glass-alert" role="alert" style={{ marginBottom: 'var(--sp-5)' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="bk-service">
            Service
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 'var(--sp-2)' }}>(optional)</span>
          </label>
          <select
            id="bk-service"
            {...register('serviceId')}
            style={{ width: '100%', height: 46, background: 'var(--glass-bg-input)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', padding: '0 var(--sp-4)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="" style={{ background: '#1a1a2e' }}>— No specific service —</option>
            {services.filter(s => s.isActive).map(s => (
              <option key={s._id} value={s._id} style={{ background: '#1a1a2e' }}>
                {s.name} — {fmtDuration(s.durationMinutes)} · {s.currency} {s.price}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="bk-notes">
            Notes for provider
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 'var(--sp-2)' }}>(optional)</span>
          </label>
          <textarea
            id="bk-notes"
            className="form-textarea"
            placeholder="Any symptoms, questions, or special requests…"
            rows={3}
            {...register('notes', { maxLength: { value: 500, message: 'Max 500 characters' } })}
          />
        </div>

        <button type="submit" className="glass-btn-primary" style={{ width: '100%', justifyContent: 'center', height: 48 }} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <svg className="spin" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
              Confirming…
            </>
          ) : 'Confirm Appointment'}
        </button>
      </form>
    </div>
  )
}

/* ─── Step 3 — Success ───────────────────────────────────────────────── */
function BookingSuccess({ appointment, onBookAnother }) {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: 'var(--sp-8) var(--sp-4)' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--sp-6)', color: 'rgba(52,211,153,0.9)' }}>
        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--sp-2)' }}>Appointment Confirmed!</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--sp-6)' }}>
        Your appointment with <strong style={{ color: 'var(--text-primary)' }}>{appointment.provider.name}</strong> on{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{fmtDate(appointment.startTime)}</strong> at{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{fmtTime(appointment.startTime)}</strong> is confirmed.
      </p>
      <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="glass-btn-primary" onClick={() => navigate('/patient/appointments')}>
          View My Appointments
        </button>
        <button className="glass-btn-ghost" onClick={onBookAnother}>
          Book Another
        </button>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function PatientBookingPage() {
  const [step, setStep]             = useState(0)
  const [provider, setProvider]     = useState(null)
  const [slot, setSlot]             = useState(null)
  const [booked, setBooked]         = useState(null)

  const reset = () => { setStep(0); setProvider(null); setSlot(null); setBooked(null) }

  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb orb-1"/><div className="aurora-orb orb-2"/>
        <div className="aurora-orb orb-3"/><div className="aurora-orb orb-4"/>
        <div className="aurora-orb orb-5"/>
      </div>

      <div className="page-wrapper">
        <div className="page-container" style={{ maxWidth: 860 }}>
          <div className="page-header">
            <h1 className="page-title">Book an Appointment</h1>
            <p className="page-subtitle">Find a provider, choose a time, and confirm your booking.</p>
          </div>

          {booked ? (
            <div className="content-card" style={{ animation: 'slideInUp 0.4s var(--ease) both' }}>
              <BookingSuccess appointment={booked} onBookAnother={reset} />
            </div>
          ) : (
            <>
              <StepBar step={step} />
              <div className="content-card" style={{ marginTop: 'var(--sp-6)', animation: 'slideInUp 0.4s var(--ease) 60ms both' }}>
                {step === 0 && (
                  <PickProvider onSelect={p => { setProvider(p); setStep(1) }} />
                )}
                {step === 1 && provider && (
                  <PickSlot
                    provider={provider}
                    onSelect={s => { setSlot(s); setStep(2) }}
                    onBack={() => { setProvider(null); setStep(0) }}
                  />
                )}
                {step === 2 && provider && slot && (
                  <ConfirmBooking
                    provider={provider}
                    slot={slot}
                    onBack={() => { setSlot(null); setStep(1) }}
                    onBooked={appt => setBooked(appt)}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
