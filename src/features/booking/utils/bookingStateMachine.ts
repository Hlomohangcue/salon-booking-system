import type { BookingStatus } from '../types'

/**
 * Valid booking status transitions.
 *
 * Centralises the lifecycle rules for a booking so both the admin service and
 * any future client-side logic validate against a single source of truth.
 *
 * - A booking is created as `pending`.
 * - `pending` may be confirmed, cancelled, or marked a no-show.
 * - `confirmed` may be completed or cancelled, or marked a no-show.
 * - Terminal states (`completed`, `cancelled`, `no-show`) accept no further
 *   transitions.
 */
const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ['confirmed', 'cancelled', 'no-show'],
  confirmed: ['completed', 'cancelled', 'no-show'],
  completed: [],
  cancelled: [],
  'no-show': [],
}

/**
 * Returns true if moving from `from` to `to` is a legal booking transition.
 */
export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) return false
  return TRANSITIONS[from].includes(to)
}

/**
 * Guard used by the admin service before applying a status mutation.
 * Throws a descriptive Error when the transition is not allowed.
 */
export function assertCanTransition(
  from: BookingStatus,
  to: BookingStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid booking transition: ${from} → ${to} is not allowed.`,
    )
  }
}
