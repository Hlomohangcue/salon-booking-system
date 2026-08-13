import type { NotificationSkipReason } from './types'

const SKIP_REASON_LABELS: Record<NotificationSkipReason, string> = {
  missing_recipient: 'No recipient on file',
  invalid_recipient: 'Invalid recipient',
  disabled: 'Notifications disabled in settings',
  malformed_booking: 'Booking data incomplete',
}

const ERROR_CODE_LABELS: Record<string, string> = {
  sender_not_configured: 'Email sender is not configured',
  provider_not_configured: 'WhatsApp provider is not configured',
  invalid_recipient: 'Invalid recipient',
  missing_recipient: 'No recipient on file',
  rate_limited: 'Provider rate limit reached — try again later',
  provider_error: 'Provider error — try again later',
  network_error: 'Network error — try again later',
}

/** Human-readable label for a skip reason code. */
export function formatSkipReason(reason: NotificationSkipReason | undefined): string {
  if (!reason) return 'Unknown reason'
  return SKIP_REASON_LABELS[reason] ?? reason.replace(/_/g, ' ')
}

/** Human-readable label for a stored error code. */
export function formatErrorCode(code: string | undefined, fallback?: string): string {
  if (!code) return fallback ?? 'Delivery failed'
  return ERROR_CODE_LABELS[code] ?? code.replace(/_/g, ' ')
}

/** Mask an email address for minimal PII exposure. */
export function maskEmail(email: string): string {
  const trimmed = email.trim()
  const at = trimmed.indexOf('@')
  if (at <= 1) return '•••'
  return `${trimmed[0]}•••${trimmed.slice(at)}`
}

/** Mask a phone number, showing only the last four digits. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '••••'
  return `•••• ${digits.slice(-4)}`
}
