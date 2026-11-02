import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/adminService'

/* ─── Shared helpers ─────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const fmtDateTime = (d) => `${fmtDate(d)} ${fmtTime(d)}`

const ROLE_COLORS = {
  admin:    { bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)',   text: 'rgba(251,113,133,0.9)' },
  provider: { bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)',  text: 'rgba(167,139,250,0.9)' },
  patient:  { bg: 'rgba(20,184,166,0.12)',  border: 'rgba(20,184,166,0.25)', text: 'rgba(45,212,191,0.9)'  },
}
const STATUS_COLORS = {
  confirmed:   { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', text: 'rgba(167,139,250,0.9)' },
  pending:     { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)',  text: 'rgba(253,211,77,0.9)'  },
  cancelled:   { bg: 'rgba(220,38,38,0.1)',   border: 'rgba(248,113,113,0.2)', text: 'rgba(252,165,165,0.9)' },
  completed:   { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)', text: 'rgba(52,211,153,0.9)'  },
  rescheduled: { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)',text: 'rgba(156,163,175,0.9)' },
}

function Badge({ label, colors }) {
  return (
    <span style={{
      fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 4,
      background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
    }}>{label}</span>
  )
}

/* ─── Confirm-delete modal ───────────────────────────────────────────────── */
function ConfirmDelete({ label, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal-card danger" style={{ maxWidth: 420 }}>
        <div className="modal-danger-icon">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </div>
        <div className="modal-title" style={{ marginBottom: 'var(--sp-2)' }}>Delete {label}?</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--sp-5)' }}>
          This action is permanent and cannot be undone.
        </p>
        <div className="modal-footer">
          <button className="glass-btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className="glass-btn-primary"
            style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
            onClick={onConfirm}
          >Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Pagination ─────────────────────────────────────────────────────────── */
function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', paddingTop: 'var(--sp-4)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <button className="glass-btn-ghost" style={{ height: 32, padding: '0 var(--sp-3)', fontSize: '0.8125rem' }}
        disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
        Page {page} of {pages}
      </span>
      <button className="glass-btn-ghost" style={{ height: 32, padding: '0 var(--sp-3)', fontSize: '0.8125rem' }}
        disabled={page >= pages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  )
}

/* ─── Loading spinner ────────────────────────────────────────────────────── */
function TableSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-10)', opacity: 0.4 }}>
      <svg className="spin" width="24" height="24" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Overview
═══════════════════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getStats()
      .then(r => setStats(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <TableSpinner />
  if (!stats) return null

  const cards = [
    { label: 'Total Users',        value: stats.users.total,              sub: `${stats.users.patients} patients · ${stats.users.providers} providers`, color: 'rgba(167,139,250,0.9)' },
    { label: 'Active Appointments', value: stats.appointments.active,     sub: `${stats.appointments.total} total`, color: 'rgba(52,211,153,0.9)' },
    { label: 'Cancellation Rate',   value: `${stats.appointments.cancellationRate}%`, sub: `${stats.appointments.cancelled} cancelled`, color: stats.appointments.cancellationRate > 20 ? 'rgba(248,113,113,0.9)' : 'rgba(251,191,36,0.8)' },
    { label: 'Open Slots',          value: stats.slots.available,         sub: `${stats.slots.total} total`, color: 'rgba(45,212,191,0.9)' },
    { label: 'Active Services',     value: stats.services.active,         sub: `${stats.services.total} total`, color: 'rgba(99,102,241,0.9)' },
    { label: 'Admin Accounts',      value: stats.users.admins,            sub: 'platform admins', color: 'rgba(244,63,94,0.8)' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--sp-4)' }}>
      {cards.map((c, i) => (
        <div key={c.label} className="stat-card" style={{ animationDelay: `${i * 60}ms` }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: c.color, lineHeight: 1, marginBottom: 'var(--sp-1)' }}>{c.value}</div>
          <div className="stat-label">{c.label}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Users
═══════════════════════════════════════════════════════════════════════════ */
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage]       = useState(1)
  const [meta, setMeta]       = useState({ total: 0, pages: 1 })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [toast, setToast]     = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, limit: 15 }
    if (search)     params.search = search
    if (roleFilter) params.role   = roleFilter
    adminService.getUsers(params)
      .then(r => { setUsers(r.data.data); setMeta({ total: r.data.total, pages: r.data.pages }) })
      .finally(() => setLoading(false))
  }, [page, search, roleFilter])

  useEffect(() => { load() }, [load])

  const toggleActive = async (user) => {
    try {
      const r = await adminService.updateUser(user._id, { isActive: !user.isActive })
      setUsers(prev => prev.map(u => u._id === user._id ? r.data.data : u))
    } catch (err) {
      setToast(err.response?.data?.message || 'Update failed')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await adminService.deleteUser(confirmDelete._id)
      setToast(null)
      setConfirmDelete(null)
      load()
    } catch (err) {
      setToast(err.response?.data?.message || 'Delete failed')
      setConfirmDelete(null)
    }
  }

  const changeRole = async (user, newRole) => {
    try {
      const r = await adminService.updateUser(user._id, { role: newRole })
      setUsers(prev => prev.map(u => u._id === user._id ? r.data.data : u))
    } catch (err) {
      setToast(err.response?.data?.message || 'Role update failed')
    }
  }

  return (
    <>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          placeholder="Search name or email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ maxWidth: 280, height: 38, fontSize: '0.875rem' }}
        />
        <select
          className="form-input"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          style={{ maxWidth: 160, height: 38, fontSize: '0.875rem' }}
        >
          <option value="">All roles</option>
          <option value="patient">Patient</option>
          <option value="provider">Provider</option>
          <option value="admin">Admin</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
          {meta.total} users
        </span>
      </div>

      {toast && (
        <div className="glass-alert" style={{ marginBottom: 'var(--sp-3)' }}>{toast}</div>
      )}

      {loading ? <TableSpinner /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: 'var(--sp-2) var(--sp-3)', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-tertiary)' }}>No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(167,139,250,0.9)', flexShrink: 0 }}>
                        {(u.name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <select
                      value={u.role}
                      onChange={e => changeRole(u, e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: ROLE_COLORS[u.role]?.text || 'var(--text-secondary)', fontSize: '0.75rem', padding: '3px 8px', cursor: 'pointer' }}
                    >
                      <option value="patient">patient</option>
                      <option value="provider">provider</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <button
                      onClick={() => toggleActive(u)}
                      style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', border: 'none',
                        background: u.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                        color:      u.isActive ? 'rgba(52,211,153,0.9)' : 'rgba(156,163,175,0.7)',
                      }}
                    >{u.isActive ? 'Active' : 'Inactive'}</button>
                  </td>
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{fmtDate(u.createdAt)}</td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <button
                      onClick={() => setConfirmDelete(u)}
                      style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: 'rgba(252,165,165,0.8)', fontSize: '0.75rem' }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={meta.pages} onPage={setPage} />

      {confirmDelete && (
        <ConfirmDelete
          label={`user "${confirmDelete.name}"`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Appointments
═══════════════════════════════════════════════════════════════════════════ */
function AppointmentsTab() {
  const [appts, setAppts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]       = useState(1)
  const [meta, setMeta]       = useState({ total: 0, pages: 1 })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [toast, setToast]     = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, limit: 15 }
    if (statusFilter) params.status = statusFilter
    adminService.getAppointments(params)
      .then(r => { setAppts(r.data.data); setMeta({ total: r.data.total, pages: r.data.pages }) })
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await adminService.deleteAppointment(confirmDelete._id)
      setConfirmDelete(null)
      load()
    } catch (err) {
      setToast(err.response?.data?.message || 'Delete failed')
      setConfirmDelete(null)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <select
          className="form-input"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          style={{ maxWidth: 180, height: 38, fontSize: '0.875rem' }}
        >
          <option value="">All statuses</option>
          {['confirmed','pending','completed','cancelled','rescheduled'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
          {meta.total} appointments
        </span>
      </div>

      {toast && <div className="glass-alert" style={{ marginBottom: 'var(--sp-3)' }}>{toast}</div>}

      {loading ? <TableSpinner /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['Patient', 'Provider', 'Service', 'Date/Time', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: 'var(--sp-2) var(--sp-3)', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appts.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-tertiary)' }}>No appointments found</td></tr>
              ) : appts.map(a => (
                <tr key={a._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{a.patient?.name || '—'}</td>
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{a.provider?.name || '—'}</td>
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{a.service?.name || '—'}</td>
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDateTime(a.startTime)}</td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <Badge label={a.status} colors={STATUS_COLORS[a.status] || STATUS_COLORS.pending} />
                  </td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <button
                      onClick={() => setConfirmDelete(a)}
                      style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: 'rgba(252,165,165,0.8)', fontSize: '0.75rem' }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={meta.pages} onPage={setPage} />

      {confirmDelete && (
        <ConfirmDelete
          label="this appointment"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Slots
═══════════════════════════════════════════════════════════════════════════ */
function SlotsTab() {
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)
  const [availFilter, setAvailFilter] = useState('')
  const [page, setPage]       = useState(1)
  const [meta, setMeta]       = useState({ total: 0, pages: 1 })
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, limit: 15 }
    if (availFilter) params.available = availFilter
    adminService.getSlots(params)
      .then(r => { setSlots(r.data.data); setMeta({ total: r.data.total, pages: r.data.pages }) })
      .finally(() => setLoading(false))
  }, [page, availFilter])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!confirmDelete) return
    await adminService.deleteSlot(confirmDelete._id).catch(() => {})
    setConfirmDelete(null)
    load()
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <select
          className="form-input"
          value={availFilter}
          onChange={e => { setAvailFilter(e.target.value); setPage(1) }}
          style={{ maxWidth: 180, height: 38, fontSize: '0.875rem' }}
        >
          <option value="">All slots</option>
          <option value="true">Available only</option>
          <option value="false">Booked only</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
          {meta.total} slots
        </span>
      </div>

      {loading ? <TableSpinner /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['Provider', 'Service', 'Date', 'Time', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: 'var(--sp-2) var(--sp-3)', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-tertiary)' }}>No slots found</td></tr>
              ) : slots.map(s => (
                <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{s.provider?.name || '—'}</td>
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{s.service?.name || '—'}</td>
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(s.startTime)}</td>
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtTime(s.startTime)} – {fmtTime(s.endTime)}</td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase',
                      background: s.isBooked ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.1)',
                      border: `1px solid ${s.isBooked ? 'rgba(139,92,246,0.25)' : 'rgba(16,185,129,0.2)'}`,
                      color: s.isBooked ? 'rgba(167,139,250,0.9)' : 'rgba(52,211,153,0.9)',
                    }}>{s.isBooked ? 'Booked' : 'Available'}</span>
                  </td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <button
                      onClick={() => setConfirmDelete(s)}
                      style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: 'rgba(252,165,165,0.8)', fontSize: '0.75rem' }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={meta.pages} onPage={setPage} />
      {confirmDelete && (
        <ConfirmDelete label="this slot" onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB: Services
═══════════════════════════════════════════════════════════════════════════ */
function ServicesTab() {
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [meta, setMeta]         = useState({ total: 0, pages: 1 })
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    adminService.getServices({ page, limit: 15 })
      .then(r => { setServices(r.data.data); setMeta({ total: r.data.total, pages: r.data.pages }) })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const toggleActive = async (svc) => {
    const r = await adminService.updateService(svc._id, { isActive: !svc.isActive }).catch(() => null)
    if (r) setServices(prev => prev.map(s => s._id === svc._id ? r.data.data : s))
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    await adminService.deleteService(confirmDelete._id).catch(() => {})
    setConfirmDelete(null)
    load()
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--sp-4)' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{meta.total} services</span>
      </div>

      {loading ? <TableSpinner /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['Service', 'Provider', 'Duration', 'Price', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: 'var(--sp-2) var(--sp-3)', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-tertiary)' }}>No services found</td></tr>
              ) : services.map(s => (
                <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{s.provider?.name || '—'}</td>
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-secondary)' }}>{s.durationMinutes} min</td>
                  <td style={{ padding: 'var(--sp-3)', color: 'var(--text-secondary)' }}>{s.currency || 'INR'} {s.price}</td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <button
                      onClick={() => toggleActive(s)}
                      style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', border: 'none', textTransform: 'uppercase',
                        background: s.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                        color:      s.isActive ? 'rgba(52,211,153,0.9)' : 'rgba(156,163,175,0.7)',
                      }}
                    >{s.isActive ? 'Active' : 'Inactive'}</button>
                  </td>
                  <td style={{ padding: 'var(--sp-3)' }}>
                    <button
                      onClick={() => setConfirmDelete(s)}
                      style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: 'rgba(252,165,165,0.8)', fontSize: '0.75rem' }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={meta.pages} onPage={setPage} />
      {confirmDelete && (
        <ConfirmDelete label={`service "${confirmDelete.name}"`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main AdminPanel page
═══════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'overview',     label: 'Overview',     icon: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>, color: 'rgba(167,139,250,0.8)' },
  { key: 'users',        label: 'Users',        icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>, color: 'rgba(45,212,191,0.8)' },
  { key: 'appointments', label: 'Appointments', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, color: 'rgba(99,102,241,0.8)' },
  { key: 'slots',        label: 'Slots',        icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, color: 'rgba(251,191,36,0.7)' },
  { key: 'services',     label: 'Services',     icon: <><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="2"/></>, color: 'rgba(244,63,94,0.7)' },
]

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabContent = {
    overview:     <OverviewTab />,
    users:        <UsersTab />,
    appointments: <AppointmentsTab />,
    slots:        <SlotsTab />,
    services:     <ServicesTab />,
  }

  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb orb-1"/><div className="aurora-orb orb-2"/>
        <div className="aurora-orb orb-3"/><div className="aurora-orb orb-4"/>
        <div className="aurora-orb orb-5"/>
      </div>

      <div className="page-wrapper">
        <div className="page-container" style={{ maxWidth: 1200 }}>

          {/* Header */}
          <div className="page-header" style={{ animation: 'slideInUp 0.35s var(--ease) both' }}>
            <div>
              <h1 className="page-title">Admin Panel</h1>
              <p className="page-subtitle">Platform management — users, appointments, slots, and services.</p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
              padding: 'var(--sp-2) var(--sp-4)',
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
              borderRadius: 'var(--r-full)', fontSize: '0.8125rem',
              color: 'rgba(251,113,133,0.9)',
            }}>
              <svg width="10" height="10" fill="rgba(244,63,94,0.8)" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5"/></svg>
              Administrator
            </div>
          </div>

          {/* Tab navigation */}
          <div style={{
            display: 'flex', gap: 'var(--sp-1)', flexWrap: 'wrap',
            marginBottom: 'var(--sp-5)',
            animation: 'slideInUp 0.4s var(--ease) 60ms both',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                  padding: 'var(--sp-2) var(--sp-4)', height: 38,
                  background: activeTab === tab.key ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activeTab === tab.key ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 'var(--r-md)', cursor: 'pointer',
                  color: activeTab === tab.key ? 'rgba(167,139,250,0.95)' : 'var(--text-secondary)',
                  fontSize: '0.875rem', fontWeight: activeTab === tab.key ? 600 : 400,
                  transition: 'all 0.2s var(--ease)',
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {tab.icon}
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="content-card" style={{ animation: 'slideInUp 0.4s var(--ease) 100ms both' }}>
            {tabContent[activeTab]}
          </div>

        </div>
      </div>
    </>
  )
}
