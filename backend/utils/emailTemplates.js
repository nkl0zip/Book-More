/* ─────────────────────────────────────────────────────────────────────────
 * emailTemplates.js
 * Generates HTML and plain-text email bodies for appointment lifecycle events.
 * All templates are self-contained (inline styles) so they render in any mail
 * client without external CSS.
 * ─────────────────────────────────────────────────────────────────────────*/

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

/* ── Shared layout wrapper ─────────────────────────────────────────────── */
const layout = (content, accentColor = '#8b5cf6') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BookMore Notification</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:${accentColor};border-radius:12px 12px 0 0;padding:28px 32px;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                BookMore
              </h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">
                Appointment Management
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                This is an automated message from BookMore.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

/* ── Detail row helper ─────────────────────────────────────────────────── */
const detailRow = (label, value) => `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
      <span style="color:#6b7280;font-size:13px;">${label}</span>
    </td>
    <td style="padding:8px 0 8px 16px;border-bottom:1px solid #f3f4f6;text-align:right;">
      <span style="color:#111827;font-size:13px;font-weight:600;">${value}</span>
    </td>
  </tr>`

/* ── Appointment detail table ──────────────────────────────────────────── */
const appointmentDetails = (appt) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:4px 16px;">
    <tbody>
      ${detailRow('Provider', appt.provider?.name || 'N/A')}
      ${appt.service ? detailRow('Service', appt.service.name) : ''}
      ${detailRow('Date', fmtDate(appt.startTime))}
      ${detailRow('Time', `${fmtTime(appt.startTime)} – ${fmtTime(appt.endTime)}`)}
      ${appt.notes ? detailRow('Notes', appt.notes) : ''}
    </tbody>
  </table>`

/* ─────────────────────────────────────────────────────────────────────────
 * 1. Booking Confirmation (to patient)
 * ─────────────────────────────────────────────────────────────────────────*/
const bookingConfirmationPatient = (appt) => ({
  subject: `Appointment confirmed — ${fmtDate(appt.startTime)}`,
  html: layout(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
      Your appointment is confirmed ✓
    </h2>
    <p style="margin:0 0 4px;color:#4b5563;font-size:15px;">
      Hi ${appt.patient?.name?.split(' ')[0] || 'there'},
    </p>
    <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">
      Your appointment has been successfully booked. Here are the details:
    </p>
    ${appointmentDetails(appt)}
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
      Please arrive 5 minutes early. To cancel or reschedule, log in to your BookMore account
      at least <strong>1 hour before</strong> your appointment.
    </p>
  `),
  text: `Appointment Confirmed\n\nHi ${appt.patient?.name?.split(' ')[0] || 'there'},\n\nYour appointment is confirmed.\n\nProvider: ${appt.provider?.name}\nDate: ${fmtDate(appt.startTime)}\nTime: ${fmtTime(appt.startTime)} – ${fmtTime(appt.endTime)}\n${appt.service ? `Service: ${appt.service.name}\n` : ''}${appt.notes ? `Notes: ${appt.notes}\n` : ''}\nPlease arrive 5 minutes early.\n\n— BookMore`,
})

/* ─────────────────────────────────────────────────────────────────────────
 * 2. New Booking Notification (to provider)
 * ─────────────────────────────────────────────────────────────────────────*/
const bookingNotificationProvider = (appt) => ({
  subject: `New appointment booked — ${fmtDate(appt.startTime)}`,
  html: layout(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
      New appointment booked
    </h2>
    <p style="margin:0 0 4px;color:#4b5563;font-size:15px;">
      Hi ${appt.provider?.name?.split(' ')[0] || 'there'},
    </p>
    <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">
      A patient has booked an appointment with you:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:4px 16px;">
      <tbody>
        ${detailRow('Patient', appt.patient?.name || 'N/A')}
        ${detailRow('Patient Email', appt.patient?.email || 'N/A')}
        ${appt.service ? detailRow('Service', appt.service.name) : ''}
        ${detailRow('Date', fmtDate(appt.startTime))}
        ${detailRow('Time', `${fmtTime(appt.startTime)} – ${fmtTime(appt.endTime)}`)}
        ${appt.notes ? detailRow('Patient Notes', appt.notes) : ''}
      </tbody>
    </table>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
      Log in to your BookMore provider dashboard to manage this appointment.
    </p>
  `),
  text: `New Appointment Booked\n\nHi ${appt.provider?.name?.split(' ')[0] || 'there'},\n\nPatient: ${appt.patient?.name} (${appt.patient?.email})\nDate: ${fmtDate(appt.startTime)}\nTime: ${fmtTime(appt.startTime)} – ${fmtTime(appt.endTime)}\n${appt.service ? `Service: ${appt.service.name}\n` : ''}${appt.notes ? `Notes: ${appt.notes}\n` : ''}\n— BookMore`,
})

/* ─────────────────────────────────────────────────────────────────────────
 * 3. Cancellation Confirmation (to patient)
 * ─────────────────────────────────────────────────────────────────────────*/
const cancellationPatient = (appt) => ({
  subject: `Appointment cancelled — ${fmtDate(appt.startTime)}`,
  html: layout(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
      Appointment cancelled
    </h2>
    <p style="margin:0 0 4px;color:#4b5563;font-size:15px;">
      Hi ${appt.patient?.name?.split(' ')[0] || 'there'},
    </p>
    <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">
      Your appointment has been cancelled${appt.cancelledBy === 'provider' ? ' by your provider' : ''}.
      ${appt.cancellationReason ? `Reason: <em>${appt.cancellationReason}</em>.` : ''}
    </p>
    ${appointmentDetails(appt)}
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
      You can book a new appointment at any time from your BookMore account.
    </p>
  `, '#ef4444'),
  text: `Appointment Cancelled\n\nHi ${appt.patient?.name?.split(' ')[0] || 'there'},\n\nYour appointment has been cancelled${appt.cancelledBy === 'provider' ? ' by your provider' : ''}.\n${appt.cancellationReason ? `Reason: ${appt.cancellationReason}\n` : ''}\nDate: ${fmtDate(appt.startTime)}\nTime: ${fmtTime(appt.startTime)} – ${fmtTime(appt.endTime)}\nProvider: ${appt.provider?.name}\n\n— BookMore`,
})

/* ─────────────────────────────────────────────────────────────────────────
 * 4. Cancellation Notification (to provider)
 * ─────────────────────────────────────────────────────────────────────────*/
const cancellationProvider = (appt) => ({
  subject: `Appointment cancelled — ${fmtDate(appt.startTime)}`,
  html: layout(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
      Appointment cancelled
    </h2>
    <p style="margin:0 0 4px;color:#4b5563;font-size:15px;">
      Hi ${appt.provider?.name?.split(' ')[0] || 'there'},
    </p>
    <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">
      The following appointment has been cancelled${appt.cancelledBy === 'patient' ? ' by the patient' : ''}.
      ${appt.cancellationReason ? `Reason: <em>${appt.cancellationReason}</em>.` : ''}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:4px 16px;">
      <tbody>
        ${detailRow('Patient', appt.patient?.name || 'N/A')}
        ${appt.service ? detailRow('Service', appt.service.name) : ''}
        ${detailRow('Date', fmtDate(appt.startTime))}
        ${detailRow('Time', `${fmtTime(appt.startTime)} – ${fmtTime(appt.endTime)}`)}
      </tbody>
    </table>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
      This slot is now available again for new bookings.
    </p>
  `, '#ef4444'),
  text: `Appointment Cancelled\n\nHi ${appt.provider?.name?.split(' ')[0] || 'there'},\n\nAn appointment has been cancelled${appt.cancelledBy === 'patient' ? ' by the patient' : ''}.\n${appt.cancellationReason ? `Reason: ${appt.cancellationReason}\n` : ''}\nPatient: ${appt.patient?.name}\nDate: ${fmtDate(appt.startTime)}\nTime: ${fmtTime(appt.startTime)} – ${fmtTime(appt.endTime)}\n\n— BookMore`,
})

/* ─────────────────────────────────────────────────────────────────────────
 * 5. Reschedule Confirmation (to patient)
 * ─────────────────────────────────────────────────────────────────────────*/
const reschedulePatient = (newAppt, oldAppt) => ({
  subject: `Appointment rescheduled — now ${fmtDate(newAppt.startTime)}`,
  html: layout(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
      Appointment rescheduled
    </h2>
    <p style="margin:0 0 4px;color:#4b5563;font-size:15px;">
      Hi ${newAppt.patient?.name?.split(' ')[0] || 'there'},
    </p>
    <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">
      Your appointment has been rescheduled${newAppt.cancelledBy === 'provider' ? ' by your provider' : ''}.
    </p>

    <p style="margin:20px 0 4px;color:#6b7280;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Previous time</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:4px 16px;opacity:0.7;">
      <tbody>
        ${detailRow('Date', fmtDate(oldAppt.startTime))}
        ${detailRow('Time', `${fmtTime(oldAppt.startTime)} – ${fmtTime(oldAppt.endTime)}`)}
      </tbody>
    </table>

    <p style="margin:16px 0 4px;color:#8b5cf6;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">New time</p>
    ${appointmentDetails(newAppt)}

    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
      Please arrive 5 minutes early. To cancel or reschedule again, log in at least
      <strong>1 hour before</strong> your new appointment time.
    </p>
  `),
  text: `Appointment Rescheduled\n\nHi ${newAppt.patient?.name?.split(' ')[0] || 'there'},\n\nYour appointment has been rescheduled.\n\nPrevious: ${fmtDate(oldAppt.startTime)} at ${fmtTime(oldAppt.startTime)}\nNew: ${fmtDate(newAppt.startTime)} at ${fmtTime(newAppt.startTime)} – ${fmtTime(newAppt.endTime)}\nProvider: ${newAppt.provider?.name}\n\n— BookMore`,
})

/* ─────────────────────────────────────────────────────────────────────────
 * 6. Reschedule Notification (to provider)
 * ─────────────────────────────────────────────────────────────────────────*/
const rescheduleProvider = (newAppt, oldAppt) => ({
  subject: `Appointment rescheduled — now ${fmtDate(newAppt.startTime)}`,
  html: layout(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
      Appointment rescheduled
    </h2>
    <p style="margin:0 0 4px;color:#4b5563;font-size:15px;">
      Hi ${newAppt.provider?.name?.split(' ')[0] || 'there'},
    </p>
    <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">
      An appointment has been rescheduled by the patient.
    </p>

    <p style="margin:20px 0 4px;color:#6b7280;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Previous time</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:4px 16px;opacity:0.7;">
      <tbody>
        ${detailRow('Date', fmtDate(oldAppt.startTime))}
        ${detailRow('Time', `${fmtTime(oldAppt.startTime)} – ${fmtTime(oldAppt.endTime)}`)}
      </tbody>
    </table>

    <p style="margin:16px 0 4px;color:#8b5cf6;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">New time</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:4px 16px;">
      <tbody>
        ${detailRow('Patient', newAppt.patient?.name || 'N/A')}
        ${newAppt.service ? detailRow('Service', newAppt.service.name) : ''}
        ${detailRow('Date', fmtDate(newAppt.startTime))}
        ${detailRow('Time', `${fmtTime(newAppt.startTime)} – ${fmtTime(newAppt.endTime)}`)}
      </tbody>
    </table>
  `),
  text: `Appointment Rescheduled\n\nHi ${newAppt.provider?.name?.split(' ')[0] || 'there'},\n\nAn appointment has been rescheduled.\n\nPatient: ${newAppt.patient?.name}\nPrevious: ${fmtDate(oldAppt.startTime)} at ${fmtTime(oldAppt.startTime)}\nNew: ${fmtDate(newAppt.startTime)} at ${fmtTime(newAppt.startTime)} – ${fmtTime(newAppt.endTime)}\n\n— BookMore`,
})

module.exports = {
  bookingConfirmationPatient,
  bookingNotificationProvider,
  cancellationPatient,
  cancellationProvider,
  reschedulePatient,
  rescheduleProvider,
}
