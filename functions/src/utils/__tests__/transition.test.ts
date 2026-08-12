import { describe, it, expect } from 'vitest'
import { isConfirmationTransition } from '../transition'

describe('isConfirmationTransition', () => {
  it('returns true for pending → confirmed', () => {
    expect(isConfirmationTransition('pending', 'confirmed')).toBe(true)
  })

  it('returns false for confirmed → confirmed', () => {
    expect(isConfirmationTransition('confirmed', 'confirmed')).toBe(false)
  })

  it('returns false for confirmed → completed', () => {
    expect(isConfirmationTransition('confirmed', 'completed')).toBe(false)
  })

  it('returns false for confirmed → cancelled', () => {
    expect(isConfirmationTransition('confirmed', 'cancelled')).toBe(false)
  })

  it('returns false for pending → cancelled', () => {
    expect(isConfirmationTransition('pending', 'cancelled')).toBe(false)
  })

  it('returns false when before status is missing', () => {
    expect(isConfirmationTransition(undefined, 'confirmed')).toBe(false)
  })

  it('returns false when after status is missing', () => {
    expect(isConfirmationTransition('pending', undefined)).toBe(false)
  })
})
