import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { serviceService } from '../../services/serviceService'

/* ─── Icon helpers ─────────────────────────────────────────────────── */
function IconBriefcase() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function IconTag() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  )
}
function IconPencil() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function IconTrash() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  )
}
function IconPlus() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}
function IconClose() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function IconWarning() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

/* ─── Service Form Modal ────────────────────────────────────────────── */
function ServiceFormModal({ service, onClose, onSaved }) {
  const isEditing = !!service
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      name:            service?.name            ?? '',
      description:     service?.description     ?? '',
      durationMinutes: service?.durationMinutes ?? 30,
      price:           service?.price           ?? '',
      currency:        service?.currency        ?? 'INR',
    },
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const payload = {
        ...data,
        durationMinutes: Number(data.durationMinutes),
        price: Number(data.price),
      }
      if (isEditing) {
        await serviceService.update(service._id, payload)
      } else {
        await serviceService.create(payload)
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
          <span className="modal-title">{isEditing ? 'Edit Service' : 'Add New Service'}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close"><IconClose /></button>
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
          <div className="stagger-form">
            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="svc-name">Service Name</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">
                  <IconBriefcase />
                </span>
                <input
                  id="svc-name"
                  type="text"
                  className={`form-input form-input-icon${errors.name ? ' error' : ''}`}
                  placeholder="e.g. General Consultation"
                  {...register('name', {
                    required: 'Service name is required',
                    minLength: { value: 2, message: 'Must be at least 2 characters' },
                    maxLength: { value: 100, message: 'Cannot exceed 100 characters' },
                  })}
                />
              </div>
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="svc-desc">
                Description
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 'var(--sp-2)' }}>(optional)</span>
              </label>
              <textarea
                id="svc-desc"
                className={`form-textarea${errors.description ? ' error' : ''}`}
                placeholder="Describe what this service includes…"
                rows={3}
                {...register('description', {
                  maxLength: { value: 500, message: 'Cannot exceed 500 characters' },
                })}
              />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>

            {/* Duration + Price row */}
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="svc-duration">Duration (minutes)</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon"><IconClock /></span>
                  <input
                    id="svc-duration"
                    type="number"
                    min="5"
                    max="480"
                    step="5"
                    className={`form-input form-input-icon${errors.durationMinutes ? ' error' : ''}`}
                    placeholder="30"
                    {...register('durationMinutes', {
                      required: 'Duration is required',
                      min: { value: 5, message: 'At least 5 min' },
                      max: { value: 480, message: 'Max 480 min' },
                      valueAsNumber: true,
                    })}
                  />
                </div>
                {errors.durationMinutes && <p className="form-error">{errors.durationMinutes.message}</p>}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="svc-price">Price</label>
                <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                  <div className="form-input-wrapper" style={{ flex: 1 }}>
                    <span className="form-input-icon"><IconTag /></span>
                    <input
                      id="svc-price"
                      type="number"
                      min="0"
                      step="0.01"
                      className={`form-input form-input-icon${errors.price ? ' error' : ''}`}
                      placeholder="500"
                      {...register('price', {
                        required: 'Price is required',
                        min: { value: 0, message: 'Cannot be negative' },
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <select
                    {...register('currency')}
                    style={{
                      width: 72, flexShrink: 0,
                      background: 'var(--glass-bg-input)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--r-md)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.875rem',
                      padding: '0 var(--sp-2)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="INR" style={{ background: '#1a1a2e' }}>INR</option>
                    <option value="USD" style={{ background: '#1a1a2e' }}>USD</option>
                    <option value="EUR" style={{ background: '#1a1a2e' }}>EUR</option>
                    <option value="GBP" style={{ background: '#1a1a2e' }}>GBP</option>
                  </select>
                </div>
                {errors.price && <p className="form-error">{errors.price.message}</p>}
              </div>
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
              ) : isEditing ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Confirm Delete Modal ──────────────────────────────────────────── */
function ConfirmModal({ service, onClose, onConfirm, loading }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card danger">
        <div className="modal-danger-icon"><IconWarning /></div>
        <div className="modal-title" style={{ marginBottom: 'var(--sp-3)' }}>Deactivate Service</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Are you sure you want to deactivate <strong style={{ color: 'var(--text-primary)' }}>{service.name}</strong>?
          It will no longer be visible to patients. You can reactivate it later.
        </p>
        <div className="modal-footer">
          <button className="glass-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="glass-btn-primary"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deactivating…' : 'Yes, deactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function ProviderServicesPage() {
  const [services, setServices]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [formModal, setFormModal]   = useState(null)   // null | 'new' | service object
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [filter, setFilter]         = useState('all')  // 'all' | 'active' | 'inactive'

  const load = () => {
    setLoading(true)
    serviceService.getMine()
      .then(res => setServices(res.data.data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSaved = () => {
    setFormModal(null)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await serviceService.remove(deleteTarget._id)
      setDeleteTarget(null)
      load()
    } catch {
      setDeleting(false)
    }
  }

  const formatDuration = (min) => {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m ? `${h}h ${m}min` : `${h}h`
  }

  const formatPrice = (price, currency) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

  const displayed = services.filter(s => {
    if (filter === 'active')   return s.isActive
    if (filter === 'inactive') return !s.isActive
    return true
  })

  const activeCount   = services.filter(s => s.isActive).length
  const inactiveCount = services.filter(s => !s.isActive).length

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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
              <div>
                <h1 className="page-title">My Services</h1>
                <p className="page-subtitle">
                  Manage the services you offer to patients.
                  {services.length > 0 && (
                    <span style={{ marginLeft: 'var(--sp-2)', color: 'var(--text-tertiary)' }}>
                      {activeCount} active · {inactiveCount} inactive
                    </span>
                  )}
                </p>
              </div>
              <button
                className="glass-btn-primary"
                style={{ flexShrink: 0, marginTop: 'var(--sp-1)' }}
                onClick={() => setFormModal('new')}
              >
                <IconPlus />
                Add Service
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          {services.length > 0 && (
            <div className="glass-tabs" style={{ marginBottom: 'var(--sp-6)', animation: 'slideInUp 0.4s var(--ease) 80ms both' }}>
              {[['all', `All (${services.length})`], ['active', `Active (${activeCount})`], ['inactive', `Inactive (${inactiveCount})`]].map(([key, label]) => (
                <button
                  key={key}
                  className={`glass-tab${filter === key ? ' active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="service-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="service-card" style={{ animationDelay: `${i * 60}ms`, minHeight: 180, opacity: 0.4 }}>
                  <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.07)' }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 14, width: '60%', background: 'rgba(255,255,255,0.07)', borderRadius: 4, marginBottom: 8 }}/>
                      <div style={{ height: 10, width: '80%', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}/>
                    </div>
                  </div>
                  <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, marginTop: 8 }}/>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="content-card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <IconBriefcase />
                </div>
                <div className="empty-state-title">
                  {services.length === 0 ? 'No services yet' : `No ${filter} services`}
                </div>
                <div className="empty-state-desc">
                  {services.length === 0
                    ? 'Add your first service so patients can book with you.'
                    : 'Switch filter to see other services.'}
                </div>
                {services.length === 0 && (
                  <button className="glass-btn-primary" onClick={() => setFormModal('new')}>
                    <IconPlus />
                    Add your first service
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="service-grid">
              {displayed.map((svc, i) => (
                <div
                  key={svc._id}
                  className={`service-card${!svc.isActive ? ' inactive' : ''}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="service-card-header">
                    <div className="service-card-icon"><IconBriefcase /></div>
                    <div className="service-card-name">{svc.name}</div>
                    <span className={`badge ${svc.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {svc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {svc.description && (
                    <div className="service-card-desc">{svc.description}</div>
                  )}

                  <div className="service-card-meta">
                    <span className="service-meta-item">
                      <IconClock />
                      {formatDuration(svc.durationMinutes)}
                    </span>
                    <span className="service-price">{formatPrice(svc.price, svc.currency)}</span>
                  </div>

                  <div className="service-card-actions">
                    <button
                      className="glass-btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', height: 34, fontSize: '0.8125rem', gap: 'var(--sp-2)' }}
                      onClick={() => setFormModal(svc)}
                    >
                      <IconPencil />
                      Edit
                    </button>
                    {svc.isActive && (
                      <button
                        className="glass-btn-ghost"
                        style={{ height: 34, paddingInline: 'var(--sp-3)', color: 'rgba(252,165,165,0.8)', borderColor: 'rgba(248,113,113,0.25)' }}
                        onClick={() => setDeleteTarget(svc)}
                        title="Deactivate"
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {formModal && (
        <ServiceFormModal
          service={formModal === 'new' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          service={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </>
  )
}
