import type { ConfirmationNotificationPayload } from '../types/notification'
import type { WhatsAppConfig } from '../config/whatsappConfig'

export interface WhatsAppTemplateComponent {
  type: 'body'
  parameters: Array<{ type: 'text'; text: string }>
}

export interface WhatsAppTemplateMessage {
  messaging_product: 'whatsapp'
  to: string
  type: 'template'
  template: {
    name: string
    language: { code: string }
    components: WhatsAppTemplateComponent[]
  }
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return dateStr
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
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
 * Converts E.164 (+266…) to Meta WhatsApp recipient format (digits only, no +).
 */
export function toWhatsAppRecipient(e164Phone: string): string {
  return e164Phone.replace(/^\+/, '')
}

/**
 * Builds a Meta-approved template message payload for appointment confirmation.
 *
 * Expected template body (submit to Meta for approval):
 *
 *   Appointment Confirmed
 *
 *   Hello {{1}}, your appointment at {{2}} is confirmed.
 *   Service: {{3}}
 *   Date: {{4}}
 *   Time: {{5}}
 *   Reference: {{6}}
 *   {{7}}
 *
 * Parameter {{7}} is salon contact info when available, otherwise "—".
 */
export function buildConfirmationWhatsAppTemplate(
  payload: ConfirmationNotificationPayload,
  recipientE164: string,
  config: Pick<WhatsAppConfig, 'templateName' | 'templateLanguage'>,
): WhatsAppTemplateMessage {
  const salonName = payload.businessInfo?.salonName?.trim() || 'Makeng Salon'
  const contactParts: string[] = []
  if (payload.businessInfo?.phone?.trim()) {
    contactParts.push(`Tel: ${payload.businessInfo.phone.trim()}`)
  }
  if (payload.businessInfo?.address?.trim()) {
    contactParts.push(payload.businessInfo.address.trim())
  }
  const contactInfo = contactParts.length > 0 ? contactParts.join(' | ') : '—'

  return {
    messaging_product: 'whatsapp',
    to: toWhatsAppRecipient(recipientE164),
    type: 'template',
    template: {
      name: config.templateName,
      language: { code: config.templateLanguage },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: payload.customerName },
            { type: 'text', text: salonName },
            { type: 'text', text: payload.serviceName },
            { type: 'text', text: formatDisplayDate(payload.preferredDate) },
            { type: 'text', text: formatDisplayTime(payload.preferredTime) },
            { type: 'text', text: payload.bookingId },
            { type: 'text', text: contactInfo },
          ],
        },
      ],
    },
  }
}
