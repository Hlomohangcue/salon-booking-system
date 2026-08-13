export type EmailErrorKind = 'permanent' | 'transient'

export class EmailServiceError extends Error {
  readonly kind: EmailErrorKind
  readonly statusCode?: number
  readonly code: string

  constructor(message: string, kind: EmailErrorKind, code: string, statusCode?: number) {
    super(message)
    this.name = 'EmailServiceError'
    this.kind = kind
    this.code = code
    this.statusCode = statusCode
  }
}

/** Classifies Brevo HTTP status codes and network failures. */
export function classifyBrevoError(statusCode: number, body?: string): EmailServiceError {
  const sanitizedBody = sanitizeErrorBody(body)

  if (statusCode === 401 || statusCode === 403) {
    return new EmailServiceError(
      'Email provider rejected the API credentials.',
      'permanent',
      'provider_unauthorized',
      statusCode,
    )
  }

  if (statusCode === 400 || statusCode === 404 || statusCode === 422) {
    return new EmailServiceError(
      sanitizedBody || 'Email provider rejected the request.',
      'permanent',
      'provider_invalid_request',
      statusCode,
    )
  }

  if (statusCode === 429) {
    return new EmailServiceError(
      'Email provider rate limit exceeded.',
      'transient',
      'provider_rate_limited',
      statusCode,
    )
  }

  if (statusCode >= 500) {
    return new EmailServiceError(
      'Email provider temporarily unavailable.',
      'transient',
      'provider_server_error',
      statusCode,
    )
  }

  return new EmailServiceError(
    sanitizedBody || `Email provider returned status ${statusCode}.`,
    'permanent',
    'provider_error',
    statusCode,
  )
}

export function classifyNetworkError(error: unknown): EmailServiceError {
  if (error instanceof EmailServiceError) return error

  const message = error instanceof Error ? error.message : 'Network error while sending email.'
  const lower = message.toLowerCase()

  if (lower.includes('abort') || lower.includes('timeout') || lower.includes('timed out')) {
    return new EmailServiceError(message, 'transient', 'network_timeout')
  }

  return new EmailServiceError(message, 'transient', 'network_error')
}

/** Removes API keys and long payloads from error text before logging/storing. */
export function sanitizeErrorBody(body?: string): string {
  if (!body) return ''
  const trimmed = body.trim().slice(0, 500)
  return trimmed.replace(/api[_-]?key["']?\s*[:=]\s*["']?[\w-]+/gi, 'api_key=[REDACTED]')
}

export function sanitizeErrorForStorage(error: unknown): { code: string; message: string } {
  if (error instanceof EmailServiceError) {
    return { code: error.code, message: error.message.slice(0, 500) }
  }
  const message = error instanceof Error ? error.message.slice(0, 500) : 'Unknown email error.'
  return { code: 'unknown_error', message }
}

/** Returns true when a safe inline retry is appropriate. */
export function isTransientEmailError(error: unknown): boolean {
  return error instanceof EmailServiceError && error.kind === 'transient'
}

const RETRY_DELAY_MS = 1000

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withTransientRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 2,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!isTransientEmailError(error) || attempt === maxAttempts) {
        throw error
      }
      await sleep(RETRY_DELAY_MS * attempt)
    }
  }
  throw lastError
}
