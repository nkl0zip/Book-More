/* ─────────────────────────────────────────────────────────────────────────
 * emailService.js
 *
 * Wraps nodemailer with two transport modes:
 *   - production  : SMTP via EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS
 *   - development : Ethereal (auto-created test account; preview URL logged)
 *   - test        : no-op (emails never sent in Jest runs)
 *
 * All sends are fire-and-forget — errors are logged but never bubble up to
 * callers so a broken mail server can never break the booking API.
 * ─────────────────────────────────────────────────────────────────────────*/
const nodemailer = require('nodemailer')

let _transporter = null

/* ── Transport factory ─────────────────────────────────────────────────── */
const getTransporter = async () => {
  if (_transporter) return _transporter

  if (process.env.EMAIL_HOST) {
    // Production / staging: use configured SMTP credentials
    _transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  } else {
    // Development fallback: Ethereal ephemeral test account
    const testAccount = await nodemailer.createTestAccount()
    _transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
    console.log(`[EmailService] Ethereal test account created: ${testAccount.user}`)
  }

  return _transporter
}

/* ── sendEmail ─────────────────────────────────────────────────────────── */
/**
 * Send an email. Fire-and-forget — never throws.
 *
 * @param {object} opts
 * @param {string}  opts.to       Recipient address
 * @param {string}  opts.subject  Email subject
 * @param {string}  opts.html     HTML body
 * @param {string}  [opts.text]   Plain-text fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (process.env.NODE_ENV === 'test') return  // silent no-op in Jest

  try {
    const transporter = await getTransporter()

    const from = process.env.EMAIL_FROM || '"BookMore" <noreply@bookmore.app>'

    const info = await transporter.sendMail({ from, to, subject, html, text })

    // In development, log Ethereal preview URL so devs can inspect rendered email
    const preview = nodemailer.getTestMessageUrl(info)
    if (preview) {
      console.log(`[EmailService] Preview: ${preview}`)
    } else {
      console.log(`[EmailService] Sent to ${to} — messageId: ${info.messageId}`)
    }
  } catch (err) {
    // Log but swallow — email failure must never break the API response
    console.error(`[EmailService] Failed to send to ${to}: ${err.message}`)
  }
}

module.exports = { sendEmail }
