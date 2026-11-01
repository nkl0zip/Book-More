import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const PATIENT_NOTIFICATIONS = [
  {
    event: 'Booking Confirmation',
    trigger: 'When you book an appointment',
    description: 'Includes provider name, date, time, service, and your notes.',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 4.79m0 0A19.79 19.79 0 016.07 1.1a2 2 0 012 .18l1.43 1.43a2 2 0 010 2.83L7.06 7.08A16 16 0 0016.92 17l1.56-1.44a2 2 0 012.83 0l1.43 1.43a2 2 0 01.18 2z"/>
      </svg>
    ),
  },
  {
    event: 'Cancellation Confirmation',
    trigger: 'When you or your provider cancels',
    description: 'Includes the cancelled appointment details and reason if provided.',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    event: 'Reschedule Notification',
    trigger: 'When you or your provider reschedules',
    description: 'Shows both the old and new appointment times side by side.',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    event: 'Cancellation Alert',
    trigger: "When a patient cancels their appointment",
    description: "Notifies you so you can make the slot available for others.",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  },
]

function InfoCard({ title, children, accentColor = 'rgba(139,92,246,0.5)' }) {
  return (
    <div className="content-card" style={{
      borderLeft: `3px solid ${accentColor}`,
      animation: 'slideInUp 0.4s var(--ease) both',
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--sp-3)', fontSize: '1rem' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function NotificationRow({ item, idx }) {
  return (
    <div style={{
      display: 'flex', gap: 'var(--sp-4)', padding: 'var(--sp-4) 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      animation: `slideInUp 0.4s var(--ease) ${80 + idx * 60}ms both`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(167,139,250,0.9)',
      }}>
        {item.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-1)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
            {item.event}
          </span>
          <span style={{
            fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '2px 7px', borderRadius: 4,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
            color: 'rgba(52,211,153,0.9)',
          }}>
            Active
          </span>
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(139,92,246,0.8)', marginBottom: 'var(--sp-1)' }}>
          {item.trigger}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {item.description}
        </div>
      </div>
    </div>
  )
}

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
        <div className="page-container" style={{ maxWidth: 680 }}>
          <div className="page-header" style={{ animation: 'slideInUp 0.35s var(--ease) both' }}>
            <h1 className="page-title">Email Notifications</h1>
            <p className="page-subtitle">
              BookMore sends automated emails to keep you informed about your appointments.
            </p>
          </div>

          {/* Delivery address card */}
          <InfoCard title="Delivery address" accentColor="rgba(139,92,246,0.5)">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 'var(--sp-4)' }}>
              All notifications are sent to the email address you registered with. To change it,
              update your account profile.
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
              padding: 'var(--sp-3) var(--sp-4)',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--r-md)',
            }}>
              <svg width="16" height="16" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.9375rem', fontFamily: 'monospace' }}>
                {user?.email || '—'}
              </span>
              <button
                onClick={copyEmail}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--sp-1) var(--sp-2)',
                  color: copied ? 'rgba(52,211,153,0.9)' : 'rgba(139,92,246,0.7)',
                  fontSize: '0.8125rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
                  transition: 'color 0.2s',
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
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </InfoCard>

          {/* Email notification list */}
          <div className="content-card" style={{ animation: 'slideInUp 0.4s var(--ease) 60ms both' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--sp-1)', fontSize: '1rem' }}>
              Your notifications
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 'var(--sp-2)' }}>
              The following emails are sent automatically. No action is needed on your part.
            </p>
            <div>
              {notifications.map((item, i) => (
                <NotificationRow key={item.event} item={item} idx={i} />
              ))}
            </div>
          </div>

          {/* How it works */}
          <InfoCard title="How emails are delivered" accentColor="rgba(16,185,129,0.4)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {[
                {
                  label: 'Instant delivery',
                  desc: 'Emails are dispatched the moment the appointment action completes — there is no delay.',
                  color: 'rgba(52,211,153,0.8)',
                },
                {
                  label: 'Non-blocking',
                  desc: 'Emails run independently of the booking confirmation — a mail server issue will never prevent your booking.',
                  color: 'rgba(167,139,250,0.8)',
                },
                {
                  label: 'No spam',
                  desc: 'BookMore only sends transactional emails. You will never receive marketing messages.',
                  color: 'rgba(251,191,36,0.8)',
                },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: item.color,
                    marginTop: 7, flexShrink: 0,
                  }}/>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {item.label} —
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                      {' '}{item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>

          {/* Dev/preview note */}
          <div style={{
            padding: 'var(--sp-4)',
            background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)',
            borderRadius: 'var(--r-md)',
            display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start',
            animation: 'slideInUp 0.4s var(--ease) 200ms both',
          }}>
            <svg width="16" height="16" fill="none" stroke="rgba(253,211,77,0.8)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'rgba(253,211,77,0.75)', lineHeight: 1.6 }}>
              <strong style={{ color: 'rgba(253,211,77,0.9)' }}>Development mode:</strong>{' '}
              When no SMTP server is configured, emails are captured by an Ethereal test inbox. The preview
              URL is logged to the server console so you can inspect the rendered email without sending
              anything to a real address.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
