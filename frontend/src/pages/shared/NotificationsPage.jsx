import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const PATIENT_NOTIFICATIONS = [
  {
    event: 'Booking Confirmation',
    trigger: 'When you book an appointment',
    description: 'Includes provider name, date, time, service, and your notes.',
    color: 'rgba(139,92,246,1)',
    colorBg: 'rgba(139,92,246,0.12)',
    colorBorder: 'rgba(139,92,246,0.25)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    event: 'Cancellation Confirmation',
    trigger: 'When you or your provider cancels',
    description: 'Includes the cancelled appointment details and reason if provided.',
    color: 'rgba(248,113,113,1)',
    colorBg: 'rgba(220,38,38,0.12)',
    colorBorder: 'rgba(248,113,113,0.25)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    event: 'Reschedule Notification',
    trigger: 'When you or your provider reschedules',
    description: 'Shows both the old and new appointment times side by side.',
    color: 'rgba(251,191,36,1)',
    colorBg: 'rgba(251,191,36,0.10)',
    colorBorder: 'rgba(251,191,36,0.25)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.29"/>
      </svg>
    ),
  },
]

const PROVIDER_NOTIFICATIONS = [
  {
    event: 'New Booking Alert',
    trigger: 'When a patient books your slot',
    description: 'Includes patient name, email, date, time, and any notes they left.',
    color: 'rgba(52,211,153,1)',
    colorBg: 'rgba(16,185,129,0.12)',
    colorBorder: 'rgba(16,185,129,0.25)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    event: 'Cancellation Alert',
    trigger: 'When a patient cancels their appointment',
    description: 'Notifies you so you can make the slot available for others.',
    color: 'rgba(248,113,113,1)',
    colorBg: 'rgba(220,38,38,0.12)',
    colorBorder: 'rgba(248,113,113,0.25)',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  },
]

const DELIVERY_FACTS = [
  {
    label: 'Instant delivery',
    desc: 'Emails are dispatched the moment the appointment action completes — no delay.',
    color: 'rgba(52,211,153,0.9)',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.2)',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    label: 'Non-blocking',
    desc: 'Email runs independently — a mail server issue will never prevent your booking.',
    color: 'rgba(167,139,250,0.9)',
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.2)',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    label: 'No spam',
    desc: 'Only transactional emails. You will never receive marketing messages.',
    color: 'rgba(253,211,77,0.9)',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.2)',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
]

export default function NotificationsPage() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const isProvider = user?.role === 'provider'
  const notifications = isProvider ? PROVIDER_NOTIFICATIONS : PATIENT_NOTIFICATIONS

  const copyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-orb orb-1"/><div className="aurora-orb orb-2"/>
        <div className="aurora-orb orb-3"/><div className="aurora-orb orb-4"/>
        <div className="aurora-orb orb-5"/>
      </div>

      <div className="page-wrapper">
        <div className="page-container" style={{ maxWidth: 700 }}>

          {/* ── Hero header ───────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-5)',
            marginBottom: 'var(--sp-8)',
            animation: 'slideInUp 0.4s var(--ease) both',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--r-lg)', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.18))',
              border: '1px solid rgba(139,92,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(139,92,246,0.2)',
              color: 'rgba(167,139,250,0.95)',
            }}>
              <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>Email Notifications</h1>
              <p className="page-subtitle" style={{ margin: 0 }}>
                BookMore sends automated emails to keep you informed about your appointments.
              </p>
            </div>
          </div>

          {/* ── Delivery address ──────────────────────────────────── */}
          <div className="content-card" style={{
            marginBottom: 'var(--sp-5)',
            animation: 'slideInUp 0.4s var(--ease) 50ms both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--r-md)',
                background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(167,139,250,0.9)', flexShrink: 0,
              }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                Delivery Address
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 var(--sp-4)' }}>
              All notifications are delivered to your registered email. To change it, update your account profile.
            </p>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
              padding: 'var(--sp-3) var(--sp-4)',
              background: 'rgba(139,92,246,0.06)',
              border: '1px solid rgba(139,92,246,0.18)',
              borderRadius: 'var(--r-md)',
            }}>
              <svg width="15" height="15" fill="none" stroke="rgba(139,92,246,0.7)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.9375rem', fontFamily: 'monospace', letterSpacing: '0.01em' }}>
                {user?.email || '—'}
              </span>
              <button
                onClick={copyEmail}
                className="btn glass-btn-ghost"
                style={{ height: 30, paddingInline: 'var(--sp-3)', fontSize: '0.8125rem',
                  color: copied ? 'rgba(52,211,153,0.9)' : undefined,
                  borderColor: copied ? 'rgba(16,185,129,0.3)' : undefined,
                }}
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Notification events ───────────────────────────────── */}
          <div style={{ marginBottom: 'var(--sp-5)', animation: 'slideInUp 0.4s var(--ease) 100ms both' }}>
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--sp-1)' }}>
                Active Notifications
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                These emails are sent automatically — no action required on your part.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {notifications.map((item, i) => (
                <div
                  key={item.event}
                  className="content-card"
                  style={{
                    padding: 'var(--sp-4) var(--sp-5)',
                    display: 'flex', gap: 'var(--sp-4)', alignItems: 'flex-start',
                    borderLeft: `3px solid ${item.color}`,
                    animation: `slideInUp 0.4s var(--ease) ${120 + i * 60}ms both`,
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--r-md)', flexShrink: 0,
                    background: item.colorBg, border: `1px solid ${item.colorBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: item.color,
                  }}>
                    {item.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 'var(--sp-1)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                        {item.event}
                      </span>
                      {/* Active pill */}
                      <span style={{
                        fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', padding: '2px 7px', borderRadius: 99,
                        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                        color: 'rgba(52,211,153,0.9)', display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(52,211,153,0.8)', display: 'inline-block' }}/>
                        Active
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: item.color, opacity: 0.85, marginBottom: 'var(--sp-1)', fontWeight: 500 }}>
                      {item.trigger}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      {item.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Delivery facts ────────────────────────────────────── */}
          <div style={{ marginBottom: 'var(--sp-5)', animation: 'slideInUp 0.4s var(--ease) 250ms both' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--sp-4)' }}>
              How Delivery Works
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 'var(--sp-3)' }}>
              {DELIVERY_FACTS.map(fact => (
                <div key={fact.label} style={{
                  padding: 'var(--sp-4)',
                  background: fact.bg,
                  border: `1px solid ${fact.border}`,
                  borderRadius: 'var(--r-lg)',
                  display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--r-md)',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${fact.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: fact.color,
                  }}>
                    {fact.icon}
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                    {fact.label}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {fact.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Dev note ──────────────────────────────────────────── */}
          <div style={{
            padding: 'var(--sp-4) var(--sp-5)',
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.18)',
            borderRadius: 'var(--r-lg)',
            display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start',
            animation: 'slideInUp 0.4s var(--ease) 320ms both',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--r-md)', flexShrink: 0,
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(253,211,77,0.9)',
            }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'rgba(253,211,77,0.9)', fontSize: '0.875rem', marginBottom: 'var(--sp-1)' }}>
                Development mode
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'rgba(253,211,77,0.65)', lineHeight: 1.6 }}>
                When no SMTP server is configured, emails are captured by an Ethereal test inbox.
                The preview URL is logged to the server console so you can inspect the rendered
                email without sending anything to a real address.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
