import type { BookingSnapshot } from '../types/notification'

const LESOTHO_PHONE_REGEX = /^\+266[2-8]\d{7}$/

export interface BookingValidationResult {
  valid: boolean
  booking?: BookingSnapshot
  error?: string
}

/**
 * Validates and normalises booking data read from Firestore.
 * Returns a structured error instead of throwing for malformed documents.
 */
export function validateBookingSnapshot(
  bookingId: string,
  data: FirebaseFirestore.DocumentData | undefined,
): BookingValidationResult {
  if (!data) {
    return { valid: false, error: 'Booking document data is missing.' }
  }

  const requiredStringFields = [
    'customerName',
    'phoneNumber',
    'serviceId',
    'serviceName',
    'preferredDate',
    'preferredTime',
    'status',
  ] as const

  for (const field of requiredStringFields) {
    const value = data[field]
    if (typeof value !== 'string' || value.trim().length === 0) {
      return { valid: false, error: `Booking field "${field}" is missing or invalid.` }
    }
  }

  if (typeof data.serviceDuration !== 'number' || data.serviceDuration <= 0) {
    return { valid: false, error: 'Booking field "serviceDuration" is invalid.' }
  }

  if (typeof data.servicePrice !== 'number' || data.servicePrice < 0) {
    return { valid: false, error: 'Booking field "servicePrice" is invalid.' }
  }

  const email =
    typeof data.email === 'string' && data.email.trim().length > 0
      ? data.email.trim()
      : undefined

  const booking: BookingSnapshot = {
    bookingId: typeof data.bookingId === 'string' ? data.bookingId : bookingId,
    customerName: data.customerName,
    phoneNumber: data.phoneNumber,
    email,
    serviceId: data.serviceId,
    serviceName: data.serviceName,
    serviceDuration: data.serviceDuration,
    servicePrice: data.servicePrice,
    preferredDate: data.preferredDate,
    preferredTime: data.preferredTime,
    status: data.status,
    source: typeof data.source === 'string' ? data.source : undefined,
  }

  return { valid: true, booking }
}

/** Returns true when the booking has a usable email recipient. */
export function hasEmailRecipient(email: string | undefined): boolean {
  return typeof email === 'string' && email.trim().length > 0
}

/** Returns true when the phone field is empty or absent. */
export function isPhoneMissing(phoneNumber: string | undefined): boolean {
  return typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0
}

/** Returns true when the booking has a valid Lesotho E.164 phone number. */
export function hasValidPhoneRecipient(phoneNumber: string | undefined): boolean {
  return typeof phoneNumber === 'string' && LESOTHO_PHONE_REGEX.test(phoneNumber)
}
