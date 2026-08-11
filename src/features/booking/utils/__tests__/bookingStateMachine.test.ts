import { describe, it, expect } from 'vitest'
import { canTransition, assertCanTransition } from '../bookingStateMachine'

describe('bookingStateMachine canTransition', () => {
  it('allows pending -> confirmed', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true)
  })

  it('allows pending -> cancelled', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true)
  })

  it('allows pending -> no-show', () => {
    expect(canTransition('pending', 'no-show')).toBe(true)
  })

  it('allows confirmed -> completed', () => {
    expect(canTransition('confirmed', 'completed')).toBe(true)
  })

  it('allows confirmed -> cancelled', () => {
    expect(canTransition('confirmed', 'cancelled')).toBe(true)
  })

  it('allows confirmed -> no-show', () => {
    expect(canTransition('confirmed', 'no-show')).toBe(true)
  })

  it('rejects same-state transitions', () => {
    expect(canTransition('pending', 'pending')).toBe(false)
    expect(canTransition('confirmed', 'confirmed')).toBe(false)
    expect(canTransition('completed', 'completed')).toBe(false)
  })

  it('rejects terminal states from further transitions', () => {
    expect(canTransition('completed', 'cancelled')).toBe(false)
    expect(canTransition('completed', 'confirmed')).toBe(false)
    expect(canTransition('cancelled', 'completed')).toBe(false)
    expect(canTransition('no-show', 'completed')).toBe(false)
  })

  it('rejects invalid forward transitions', () => {
    expect(canTransition('pending', 'completed')).toBe(false)
    expect(canTransition('confirmed', 'pending')).toBe(false)
  })
})

describe('bookingStateMachine assertCanTransition', () => {
  it('does not throw for a legal transition', () => {
    expect(() => assertCanTransition('pending', 'confirmed')).not.toThrow()
  })

  it('throws for an illegal transition', () => {
    expect(() => assertCanTransition('completed', 'cancelled')).toThrow(
      /Invalid booking transition/,
    )
  })

  it('throws for a same-state transition', () => {
    expect(() => assertCanTransition('pending', 'pending')).toThrow(
      /Invalid booking transition/,
    )
  })
})
