/**
 * Consistent, user-friendly error codes for the booking engine.
 *
 * Raw Firebase errors are never surfaced directly to the UI. Instead, service
 * functions throw a BookingError with a stable machine-readable code and a
 * human-friendly message that a caller (e.g. a hook or the wizard) can display.
 */

export type BookingErrorCode =
  | 'SLOT_UNAVAILABLE'
  | 'BOOKING_ALREADY_EXISTS'
  | 'INVALID_BOOKING'
  | 'SERVICE_NOT_FOUND'
  | 'TRANSACTION_FAILED'
  | 'UNKNOWN_ERROR'

export class BookingError extends Error {
  readonly code: BookingErrorCode

  constructor(code: BookingErrorCode, message: string) {
    super(message)
    this.name = 'BookingError'
    this.code = code
  }
}

/** Maps a BookingErrorCode to a default user-friendly message. */
export const BOOKING_ERROR_MESSAGES: Record<BookingErrorCode, string> = {
  SLOT_UNAVAILABLE:
    'Sorry, this time slot was just taken. Please choose another time.',
  BOOKING_ALREADY_EXISTS:
    'You already have a pending booking for this date and time.',
  INVALID_BOOKING:
    'The booking details are invalid. Please review your information and try again.',
  SERVICE_NOT_FOUND:
    'The selected service could not be found. Please choose another service.',
  TRANSACTION_FAILED:
    'We could not complete your booking right now. Please try again.',
  UNKNOWN_ERROR:
    'Something went wrong while booking your appointment. Please try again later.',
}

/** Throws a BookingError with a known code and a user-friendly message. */
export function throwBookingError(
  code: BookingErrorCode,
  message?: string,
): never {
  throw new BookingError(code, message ?? BOOKING_ERROR_MESSAGES[code])
}

/**
 * Wraps an unknown error into a BookingError so callers never receive a raw
 * Firebase error. Preserves an existing BookingError as-is; otherwise maps
 * anything else to UNKNOWN_ERROR.
 */
export function toBookingError(error: unknown): BookingError {
  if (error instanceof BookingError) return error
  const message = error instanceof Error ? error.message : undefined
  return new BookingError('UNKNOWN_ERROR', message ?? BOOKING_ERROR_MESSAGES.UNKNOWN_ERROR)
}
