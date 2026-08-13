import { describe, it, expect } from 'vitest'
import {
  classifyBrevoError,
  sanitizeErrorBody,
  isTransientEmailError,
  EmailServiceError,
} from '../emailErrors'

describe('emailErrors', () => {
  it('classifies 401 as permanent', () => {
    const error = classifyBrevoError(401)
    expect(error.kind).toBe('permanent')
    expect(isTransientEmailError(error)).toBe(false)
  })

  it('classifies 429 as transient', () => {
    const error = classifyBrevoError(429)
    expect(error.kind).toBe('transient')
    expect(isTransientEmailError(error)).toBe(true)
  })

  it('classifies 503 as transient', () => {
    const error = classifyBrevoError(503)
    expect(error.kind).toBe('transient')
  })

  it('sanitizes api keys from error bodies', () => {
    const sanitized = sanitizeErrorBody('api-key: secret123456')
    expect(sanitized).not.toContain('secret123456')
    expect(sanitized).toContain('[REDACTED]')
  })

  it('EmailServiceError stores code without secret', () => {
    const error = new EmailServiceError('Unauthorized', 'permanent', 'provider_unauthorized', 401)
    expect(error.message).not.toContain('api')
  })
})
