import type { ConfirmationNotificationPayload } from '../types/notification'

export interface ConfirmationEmailContent {
  subject: string
  html: string
  text: string
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return dateStr
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDisplayTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Builds a professional appointment confirmation email for Makeng Salon.
 * Uses only data present on the booking payload and optional businessInfo.
 */
export function buildConfirmationEmail(
  payload: ConfirmationNotificationPayload,
): ConfirmationEmailContent {
  const salonName = payload.businessInfo?.salonName?.trim() || 'Makeng Salon'
  const salonPhone = payload.businessInfo?.phone?.trim()
  const salonEmail = payload.businessInfo?.email?.trim()
  const salonAddress = payload.businessInfo?.address?.trim()

  const displayDate = formatDisplayDate(payload.preferredDate)
  const displayTime = formatDisplayTime(payload.preferredTime)

  const subject = `Your appointment at ${salonName} is confirmed`

  const contactLines: string[] = []
  if (salonPhone) contactLines.push(`Phone: ${salonPhone}`)
  if (salonEmail) contactLines.push(`Email: ${salonEmail}`)
  if (salonAddress) contactLines.push(`Address: ${salonAddress}`)

  const contactHtml =
    contactLines.length > 0
      ? `<p style="margin:16px 0 0;color:#555;font-size:14px;line-height:1.6;">${contactLines.join('<br>')}</p>`
      : ''

  const contactText =
    contactLines.length > 0 ? `\n\nContact us:\n${contactLines.join('\n')}` : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:#6b21a8;padding:24px 28px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">Appointment Confirmed</h1>
          <p style="margin:8px 0 0;color:#e9d5ff;font-size:14px;">${salonName}</p>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 16px;color:#111827;font-size:16px;line-height:1.5;">Hi ${payload.customerName},</p>
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">Your appointment has been confirmed. We look forward to seeing you.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf5ff;border:1px solid #ede9fe;border-radius:8px;margin-bottom:20px;">
            <tr><td style="padding:16px 18px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Appointment details</p>
              <p style="margin:0;color:#111827;font-size:15px;line-height:1.7;">
                <strong>Service:</strong> ${payload.serviceName}<br>
                <strong>Date:</strong> ${displayDate}<br>
                <strong>Time:</strong> ${displayTime}<br>
                <strong>Duration:</strong> ${payload.serviceDuration} minutes<br>
                <strong>Reference:</strong> ${payload.bookingId}
              </p>
            </td></tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">Please keep your booking reference for any enquiries about your appointment.</p>
          ${contactHtml}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">${salonName}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `Hi ${payload.customerName},

Your appointment at ${salonName} has been confirmed.

Service: ${payload.serviceName}
Date: ${displayDate}
Time: ${displayTime}
Duration: ${payload.serviceDuration} minutes
Booking reference: ${payload.bookingId}

Please keep your booking reference for any enquiries about your appointment.${contactText}

${salonName}`

  return { subject, html, text }
}
