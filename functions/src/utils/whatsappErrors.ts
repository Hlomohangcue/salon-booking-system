export type WhatsAppErrorKind = 'permanent' | 'transient'

export class WhatsAppServiceError extends Error {
  readonly kind: WhatsAppErrorKind
  readonly statusCode?: number
  readonly code: string

  constructor(message: string, kind: WhatsAppErrorKind, code: string, statusCode?: number) {
    super(message)
    this.name = 'WhatsAppServiceError'
    this.kind = kind
    this.code = code
    this.statusCode = statusCode
  }
}

/** Classifies Meta Graph API HTTP status codes. */
export function classifyMetaWhatsAppError(statusCode: number, body?: string): WhatsAppServiceError {
  const sanitizedBody = sanitizeWhatsAppErrorBody(body)
  const lower = sanitizedBody.toLowerCase()

  if (statusCode === 401 || statusCode === 403) {
    return new WhatsAppServiceError(
      'WhatsApp provider rejected the API credentials.',
      'permanent',
      'provider_unauthorized',
      statusCode,
    )
  }

  if (statusCode === 400 || statusCode === 404) {
    if (lower.includes('template') || lower.includes('132000') || lower.includes('132001')) {
      return new WhatsAppServiceError(
        sanitizedBody || 'WhatsApp template is invalid or not approved.',
        'permanent',
        'invalid_template',
        statusCode,
      )
    }
    if (
      lower.includes('phone') ||
      lower.includes('recipient') ||
      lower.includes('131026') ||
      lower.includes('131047')
    ) {
      return new WhatsAppServiceError(
        sanitizedBody || 'WhatsApp recipient phone number is invalid.',
        'permanent',
        'invalid_recipient',
        statusCode,
      )
    }
    return new WhatsAppServiceError(
      sanitizedBody || 'WhatsApp provider rejected the request.',
      'permanent',
      'provider_invalid_request',
      statusCode,
    )
  }

  if (statusCode === 429) {
    return new WhatsAppServiceError(
      'WhatsApp provider rate limit exceeded.',
      'transient',
      'provider_rate_limited',
      statusCode,
    )
  }

  if (statusCode >= 500) {
    return new WhatsAppServiceError(
      'WhatsApp provider temporarily unavailable.',
      'transient',
      'provider_server_error',
      statusCode,
    )
  }

  return new WhatsAppServiceError(
    sanitizedBody || `WhatsApp provider returned status ${statusCode}.`,
    'permanent',
    'provider_error',
    statusCode,
  )
}

export function classifyWhatsAppNetworkError(error: unknown): WhatsAppServiceError {
  if (error instanceof WhatsAppServiceError) return error

  const message =
    error instanceof Error ? error.message : 'Network error while sending WhatsApp message.'
  const lower = message.toLowerCase()

  if (lower.includes('abort') || lower.includes('timeout') || lower.includes('timed out')) {
    return new WhatsAppServiceError(message, 'transient', 'network_timeout')
  }

  return new WhatsAppServiceError(message, 'transient', 'network_error')
}

/** Removes access tokens and long payloads from error text. */
export function sanitizeWhatsAppErrorBody(body?: string): string {
  if (!body) return ''
  const trimmed = body.trim().slice(0, 500)
  return trimmed
    .replace(/Bearer\s+[\w.-]+/gi, 'Bearer [REDACTED]')
    .replace(/access[_-]?token["']?\s*[:=]\s*["']?[\w-]+/gi, 'access_token=[REDACTED]')
}

export function sanitizeWhatsAppErrorForStorage(error: unknown): { code: string; message: string } {
  if (error instanceof WhatsAppServiceError) {
    return { code: error.code, message: error.message.slice(0, 500) }
  }
  const message =
    error instanceof Error ? error.message.slice(0, 500) : 'Unknown WhatsApp error.'
  return { code: 'unknown_error', message }
}

export function isTransientWhatsAppError(error: unknown): boolean {
  return error instanceof WhatsAppServiceError && error.kind === 'transient'
}

const RETRY_DELAY_MS = 1000

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withWhatsAppTransientRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 2,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!isTransientWhatsAppError(error) || attempt === maxAttempts) {
        throw error
      }
      await sleep(RETRY_DELAY_MS * attempt)
    }
  }
  throw lastError
}
