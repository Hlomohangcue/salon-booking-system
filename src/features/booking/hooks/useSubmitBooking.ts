import { useCallback, useState } from 'react'
import { createBooking } from '../services/bookingService'
import { BookingError, BOOKING_ERROR_MESSAGES } from '../errors/bookingErrors'
import type { BookingFormValues } from '../types'
import type { WizardData } from './useBooking'

export interface UseSubmitBookingReturn {
  /** Triggers the booking write. Resolves with the Firestore booking ID. */
  submit: () => Promise<string>
  /** True while the transaction is in-flight — used to disable the Confirm button. */
  submitting: boolean
  /** User-friendly error message, or null when there is no error. */
  error: string | null
  /** The Firestore document ID of the created booking (set only on success). */
  bookingId: string | null
}

/**
 * Builds the BookingFormValues from the wizard's collected data.
 * Only the fields that createBooking() reads are forwarded — business logic
 * (transaction, availability, duplicate prevention) lives in bookingService.ts.
 */
function toBookingFormValues(data: WizardData): BookingFormValues {
  return {
    serviceId: data.serviceId,
    preferredDate: data.preferredDate,
    preferredTime: data.preferredTime,
    customerName: data.customerName,
    phoneNumber: data.phoneNumber,
    email: data.email || undefined,
    notes: data.notes || undefined,
  }
}

/**
 * Connects the wizard's collected data to the booking service.
 *
 * Responsibilities:
 *  - Transform WizardData into BookingFormValues.
 *  - Call createBooking() (the transactional write).
 *  - Expose loading state so the UI can prevent duplicate submissions.
 *  - Map BookingError codes to user-friendly messages.
 *  - Expose the returned booking reference on success.
 *
 * It deliberately contains no business/validation logic — that all lives in
 * the service layer (bookingService.ts) and utils (bookingValidation.ts).
 */
export function useSubmitBooking(data: WizardData): UseSubmitBookingReturn {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)

  const submit = useCallback(async (): Promise<string> => {
    // Prevent a second submission while one is already in-flight.
    setSubmitting(true)
    setError(null)

    try {
      const id = await createBooking(toBookingFormValues(data))
      setBookingId(id)
      return id
    } catch (err: unknown) {
      // Surface a stable, user-friendly message for known error codes.
      if (err instanceof BookingError) {
        setError(BOOKING_ERROR_MESSAGES[err.code])
      } else {
        setError(BOOKING_ERROR_MESSAGES.UNKNOWN_ERROR)
      }
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [data])

  return { submit, submitting, error, bookingId }
}
