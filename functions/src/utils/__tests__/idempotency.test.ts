import { describe, it, expect } from 'vitest'
import { buildIdempotencyKey } from '../idempotency'

describe('buildIdempotencyKey', () => {
  it('builds a stable key per booking, event, and channel', () => {
    expect(buildIdempotencyKey('abc123', 'confirmation', 'email')).toBe(
      'abc123:confirmation:email',
    )
    expect(buildIdempotencyKey('abc123', 'confirmation', 'whatsapp')).toBe(
      'abc123:confirmation:whatsapp',
    )
  })
})
