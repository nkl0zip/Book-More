import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { slotService } from '../../services/slotService'
import { serviceService } from '../../services/serviceService'

/* ─── Date helpers ──────────────────────────────────────────────────── */
const startOfWeek = (date) => {
  const d = new Date(date)
  const day = d.getDay()           // 0 = Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)  // Monday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const addDays = (date, n) => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

const fmtDateTimeLocal = (d) => {
  const dt = new Date(d)
  const pad = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

const toISO = (localDatetimeString) => new Date(localDatetimeString).toISOString()

/* ─── Icons ─────────────────────────────────────────────────────────── */
const IconCalendar = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconPlus = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconChevLeft = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const IconChevRight = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const IconClose = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconTrash = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)
const IconList = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IconGrid = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)

/* ─── Slot Form Modal ────────────────────────────────────────────────── */
function SlotFormModal({ slot, defaultDate, services, onClose, onSaved }) {
  const isEditing = !!slot
  const [serverError, setServerError] = useState('')

  const defaultStart = slot
    ? fmtDateTimeLocal(slot.startTime)
    : defaultDate
      ? fmtDateTimeLocal(new Date(defaultDate.setHours(9, 0, 0, 0)))
      : ''

  const defaultEnd = slot
    ? fmtDateTimeLocal(slot.endTime)
    : defaultDate
      ? fmtDateTimeLocal(new Date(new Date(defaultDate).setHours(9, 30, 0, 0)))
      : ''

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      startTime: defaultStart,
      endTime:   defaultEnd,
      service:   slot?.service?._id ?? slot?.service ?? '',
      notes:     slot?.notes ?? '',
    },
  })

  const startVal = watch('startTime')

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const payload = {
        startTime: toISO(data.startTime),
        endTime:   toISO(data.endTime),
        service:   data.service || null,
        notes:     data.notes || '',
      }
      if (isEditing) {
        await slotService.update(slot._id, payload)
      } else {
        await slotService.create(payload)
      }
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <span className="modal-title">{isEditing ? 'Edit Slot' : 'Add Availability Slot'}</span>
          <button className="modal-close" onClick={onClose}><IconClose /></button>
        </div>

        {serverError && (
          <div className="glass-alert" role="alert" style={{ marginBottom: 'var(--sp-5)' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {serverError}
          </div>
        )}

        {isEditing && slot.isBooked && (
          <div className="success-banner" style={{ background: 'rgba(120,53,15,0.35)', borderColor: 'rgba(251,191,36,0.25)', borderLeftColor: '#d97706', color: 'rgba(253,230,138,1)', marginBottom: 'var(--sp-5)' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            This slot is booked — time cannot be changed.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="stagger-form">
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="sl-start">Start Time</label>
                <input
                  id="sl-start"
                  type="datetime-local"
                  className={`form-input${errors.startTime ? ' error' : ''}`}
                  disabled={isEditing && slot.isBooked}
                  {...register('startTime', {
                    required: 'Start time is required',
                    validate: v => {
                      if (isEditing && slot.isBooked) return true
                      return new Date(v) > new Date() || 'Start time must be in the future'
                    },
                  })}
                />
                {errors.startTime && <p className="form-error">{errors.startTime.message}</p>}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="sl-end">End Time</label>
                <input
                  id="sl-end"
                  type="datetime-local"
                  className={`form-input${errors.endTime ? ' error' : ''}`}
                  disabled={isEditing && slot.isBooked}
                  {...register('endTime', {
                    required: 'End time is required',
                    validate: v => !startVal || new Date(v) > new Date(startVal) || 'End time must be after start time',
                  })}
                />
                {errors.endTime && <p className="form-error">{errors.endTime.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sl-service">
                Service
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 'var(--sp-2)' }}>(optional)</span>
              </label>
              <select
                id="sl-service"
                {...register('service')}
                style={{
                  width: '100%', height: 46,
                  background: 'var(--glass-bg-input)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9375rem',
                  padding: '0 var(--sp-4)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="" style={{ background: '#1a1a2e' }}>— No specific service —</option>
                {services.map(s => (
                  <option key={s._id} value={s._id} style={{ background: '#1a1a2e' }}>
                    {s.name} ({s.durationMinutes} min)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sl-notes">
                Notes
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 'var(--sp-2)' }}>(optional)</span>
              </label>
              <textarea
                id="sl-notes"
                className={`form-textarea${errors.notes ? ' error' : ''}`}
                placeholder="Any notes for this slot…"
                rows={2}
                {...register('notes', { maxLength: { value: 300, message: 'Max 300 characters' } })}
              />
              {errors.notes && <p className="form-error">{errors.notes.message}</p>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="glass-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="glass-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="spin" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                  {isEditing ? 'Saving…' : 'Creating…'}
                </>
              ) : isEditing ? 'Save Changes' : 'Create Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Week Calendar View ─────────────────────────────────────────────── */
function WeekCalendar({ slots, weekStart, onDayClick, onSlotClick }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  const slotsForDay = (day) =>
    slots.filter(s => sameDay(new Date(s.startTime), day))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  return (
    <div className="week-calendar">
      {days.map((day, idx) => {
        const isToday = sameDay(day, today)
        const isPast  = day < today && !isToday
        const daySl   = slotsForDay(day)
        return (
          <div
            key={idx}
            className={`week-day${isToday ? ' today' : ''}${isPast ? ' past' : ''}`}
            onClick={() => !isPast && onDayClick(day)}
          >
            <div className="week-day-header">
              <span className="week-day-name">
                {day.toLocaleDateString('en-GB', { weekday: 'short' })}
              </span>
              <span className={`week-day-num${isToday ? ' today' : ''}`}>
                {day.getDate()}
              </span>
            </div>
            <div className="week-day-slots">
              {daySl.length === 0 && !isPast && (
                <div className="week-add-hint">
                  <span>+ Add</span>
                </div>
              )}
              {daySl.map(s => (
                <button
                  key={s._id}
                  className={`slot-chip${s.isBooked ? ' booked' : ''}`}
                  onClick={e => { e.stopPropagation(); onSlotClick(s) }}
                  title={`${fmtTime(s.startTime)} – ${fmtTime(s.endTime)}${s.service ? ' · ' + s.service.name : ''}`}
                >
                  <span className="slot-chip-time">{fmtTime(s.startTime)}</span>
                  {s.service && <span className="slot-chip-label">{s.service.name}</span>}
                  {s.isBooked && <span className="slot-chip-booked">Booked</span>}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── List View ─────────────────────────────────────────────────────── */
function SlotList({ slots, onEdit, onDelete, selected, onToggleSelect }) {
  if (slots.length === 0) {
    return (
      <div className="content-card">
        <div className="empty-state" style={{ padding: 'var(--sp-8)' }}>
          <div className="empty-state-icon">
            <IconCalendar />
          </div>
          <div className="empty-state-title">No slots in this range</div>
          <div className="empty-state-desc">Use the calendar to pick a day and add a slot, or click "Add Slot".</div>
        </div>
      </div>
    )
  }

  return (
    <div className="slot-list">
      {slots.map((s, i) => (
        <div
          key={s._id}
          className={`slot-list-item${s.isBooked ? ' booked' : ''}${selected.has(s._id) ? ' selected' : ''}`}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <label className="slot-select-box" onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected.has(s._id)}
              disabled={s.isBooked}
              onChange={() => onToggleSelect(s._id)}
              style={{ display: 'none' }}
            />
            <span className={`slot-checkbox${selected.has(s._id) ? ' checked' : ''}${s.isBooked ? ' disabled' : ''}`}/>
          </label>
          <div className="slot-list-time">
            <span className="slot-list-date">{fmtDate(s.startTime)}</span>
            <span className="slot-list-range">{fmtTime(s.startTime)} – {fmtTime(s.endTime)}</span>
          </div>
          <div className="slot-list-meta">
            {s.service
              ? <span className="slot-service-tag">{s.service.name}</span>
              : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>Any service</span>
            }
            {s.isBooked
              ? <span className="badge badge-booked">Booked</span>
              : <span className="badge badge-active">Available</span>
            }
          </div>
          <div className="slot-list-actions">
            <button
              className="glass-btn-ghost"
              style={{ height: 32, paddingInline: 'var(--sp-3)', fontSize: '0.8125rem', gap: 'var(--sp-2)' }}
              onClick={() => onEdit(s)}
            >
              Edit
            </button>
            {!s.isBooked && (
              <button
                className="glass-btn-ghost"
                style={{ height: 32, paddingInline: 'var(--sp-3)', color: 'rgba(252,165,165,0.8)', borderColor: 'rgba(248,113,113,0.25)' }}
                onClick={() => onDelete(s)}
                title="Delete slot"
              >
                <IconTrash />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function ProviderSlotsPage() {
  const [slots, setSlots]           = useState([])
  const [services, setServices]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [weekStart, setWeekStart]   = useState(() => startOfWeek(new Date()))
  const [view, setView]             = useState('calendar')  // 'calendar' | 'list'
  const [formModal, setFormModal]   = useState(null)        // null | { defaultDate } | slot object
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [selected, setSelected]     = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const weekEnd = addDays(weekStart, 6)

  const load = useCallback(() => {
    setLoading(true)
    const from = weekStart.toISOString()
    const to   = addDays(weekEnd, 1).toISOString()
    slotService.getMine({ from, to })
      .then(res => setSlots(res.data.data))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [weekStart]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  useEffect(() => {
    serviceService.getMine()
      .then(res => setServices(res.data.data.filter(s => s.isActive)))
      .catch(() => setServices([]))
  }, [])

  // Clear selection when week changes
  useEffect(() => { setSelected(new Set()) }, [weekStart])

  const handleSaved = () => { setFormModal(null); load() }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await slotService.remove(deleteTarget._id)
      setDeleteTarget(null)
      load()
    } catch {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    setBulkDeleting(true)
    try {
      await slotService.bulkRemove([...selected])
      setSelected(new Set())
      load()
    } catch {
      setBulkDeleting(false)
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const weekLabel = (() => {
    const opts = { day: 'numeric', month: 'short' }
    const s = weekStart.toLocaleDateString('en-GB', opts)
    const e = weekEnd.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })
    return `${s} – ${e}`
  })()

  const totalSlots     = slots.length
  const availableSlots = slots.filter(s => !s.isBooked).length
  const bookedSlots    = slots.filter(s => s.isBooked).length

  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb orb-1"/><div className="aurora-orb orb-2"/>
        <div className="aurora-orb orb-3"/><div className="aurora-orb orb-4"/>
        <div className="aurora-orb orb-5"/>
      </div>

      <div className="page-wrapper">
        <div className="page-container">

          {/* Header */}
          <div className="page-header" style={{ animationDelay: '0ms' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
              <div>
                <h1 className="page-title">My Availability</h1>
                <p className="page-subtitle">
                  Manage your bookable time slots.
                  {totalSlots > 0 && (
                    <span style={{ marginLeft: 'var(--sp-2)', color: 'var(--text-tertiary)' }}>
                      {availableSlots} available · {bookedSlots} booked this week
                    </span>
                  )}
                </p>
              </div>
              <button
                className="glass-btn-primary"
                style={{ flexShrink: 0, marginTop: 'var(--sp-1)' }}
                onClick={() => setFormModal({ defaultDate: new Date() })}
              >
                <IconPlus />
                Add Slot
              </button>
            </div>
          </div>

          {/* Week nav + view toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)', flexWrap: 'wrap', animation: 'slideInUp 0.4s var(--ease) 80ms both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <button
                className="glass-btn-ghost"
                style={{ height: 36, paddingInline: 'var(--sp-3)' }}
                onClick={() => setWeekStart(d => addDays(d, -7))}
                title="Previous week"
              ><IconChevLeft /></button>

              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem', minWidth: 180, textAlign: 'center' }}>
                {weekLabel}
              </span>

              <button
                className="glass-btn-ghost"
                style={{ height: 36, paddingInline: 'var(--sp-3)' }}
                onClick={() => setWeekStart(d => addDays(d, 7))}
                title="Next week"
              ><IconChevRight /></button>

              <button
                className="glass-btn-ghost"
                style={{ height: 36, fontSize: '0.8125rem', marginLeft: 'var(--sp-2)' }}
                onClick={() => setWeekStart(startOfWeek(new Date()))}
              >Today</button>
            </div>

            <div className="glass-tabs" style={{ marginBottom: 0, marginLeft: 'auto' }}>
              <button className={`glass-tab${view === 'calendar' ? ' active' : ''}`} onClick={() => setView('calendar')} style={{ gap: 'var(--sp-2)' }}>
                <IconGrid /> Week
              </button>
              <button className={`glass-tab${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')} style={{ gap: 'var(--sp-2)' }}>
                <IconList /> List
              </button>
            </div>
          </div>

          {/* Bulk delete toolbar */}
          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', padding: 'var(--sp-3) var(--sp-4)', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 'var(--r-lg)', animation: 'fadeIn 0.2s var(--ease)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {selected.size} slot{selected.size > 1 ? 's' : ''} selected
              </span>
              <button
                className="glass-btn-ghost"
                style={{ height: 32, fontSize: '0.8125rem', color: 'rgba(252,165,165,0.8)', borderColor: 'rgba(248,113,113,0.25)', gap: 'var(--sp-2)' }}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                <IconTrash />
                {bulkDeleting ? 'Deleting…' : `Delete ${selected.size}`}
              </button>
              <button
                className="glass-btn-ghost"
                style={{ height: 32, fontSize: '0.8125rem', marginLeft: 'auto' }}
                onClick={() => setSelected(new Set())}
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Main content */}
          {loading ? (
            <div className="content-card" style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              <svg className="spin" width="28" height="28" fill="none" stroke="rgba(139,92,246,0.7)" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
            </div>
          ) : view === 'calendar' ? (
            <WeekCalendar
              slots={slots}
              weekStart={weekStart}
              onDayClick={(day) => setFormModal({ defaultDate: day })}
              onSlotClick={(s) => setFormModal(s)}
            />
          ) : (
            <SlotList
              slots={slots}
              onEdit={(s) => setFormModal(s)}
              onDelete={(s) => setDeleteTarget(s)}
              selected={selected}
              onToggleSelect={toggleSelect}
            />
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 'var(--sp-5)', marginTop: 'var(--sp-6)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', display: 'inline-block' }}/>
              Available
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(251,191,36,0.6)', display: 'inline-block' }}/>
              Booked
            </span>
          </div>

        </div>
      </div>

      {/* Create / Edit modal */}
      {formModal && (
        <SlotFormModal
          slot={formModal._id ? formModal : null}
          defaultDate={formModal._id ? null : (formModal.defaultDate || new Date())}
          services={services}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal-card danger">
            <div className="modal-danger-icon">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="modal-title" style={{ marginBottom: 'var(--sp-3)' }}>Delete Slot</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              Delete the slot on <strong style={{ color: 'var(--text-primary)' }}>{fmtDate(deleteTarget.startTime)}</strong>{' '}
              at <strong style={{ color: 'var(--text-primary)' }}>{fmtTime(deleteTarget.startTime)}</strong>?
              This cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="glass-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="glass-btn-primary"
                style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
