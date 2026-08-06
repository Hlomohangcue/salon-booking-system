import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Booking, BookingStatus } from '../../booking/types'
import {
  getAllBookings,
  confirmBooking,
  cancelBooking,
  completeBooking,
  markNoShow,
  adminBookingError,
} from '../services/adminBookingService'
import { BookingError } from '../../booking/errors/bookingErrors'

export interface UseAdminBookingsReturn {
  /** All bookings, sorted newest first. */
  bookings: Booking[]
  loading: boolean
  /** Human-readable error message, or null when idle/success. */
  error: string | null
  /** Re-fetch bookings from Firestore. */
  refresh: () => Promise<void>
  /** Whether a mutation is currently in flight. */
  mutating: boolean
  /** Mutation error message scoped to the last action. */
  mutationError: string | null
  /** Confirm a pending booking. */
  confirm: (bookingId: string) => Promise<void>
  /** Cancel a booking with an optional reason. */
  cancel: (bookingId: string, reason?: string) => Promise<void>
  /** Mark a booking as completed. */
  complete: (bookingId: string) => Promise<void>
  /** Mark a booking as a no-show. */
  noShow: (bookingId: string) => Promise<void>
}

/**
 * Loads bookings from Firestore and exposes status-transition actions that
 * update the local list optimistically after a successful write.
 */
export function useAdminBookings(): UseAdminBookingsReturn {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllBookings()
      setBookings(data)
    } catch (err: unknown) {
      const bookingError: BookingError = adminBookingError(err)
      setError(bookingError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /**
   * Updates a booking's status locally after a successful Firestore write.
   * Replaces the booking in the list so the UI reflects the new status.
   */
  const applyLocalUpdate = useCallback(
    (bookingId: string, update: (current: Booking) => Booking) => {
      setBookings((prev) =>
        prev.map((b) => (b.bookingId === bookingId ? update(b) : b)),
      )
    },
    [],
  )

  const runMutation = useCallback(
    async (
      action: (bookingId: string) => Promise<void>,
      status: BookingStatus,
      bookingId: string,
    ) => {
      setMutating(true)
      setMutationError(null)
      try {
        await action(bookingId)
        // Reflect the change immediately without a full reload.
        applyLocalUpdate(bookingId, (current) => {
          const updated: Booking = {
            ...current,
            status,
            updatedAt: new Date(),
          }
          if (current.status !== status) {
            if (status === 'confirmed') updated.confirmedAt = new Date()
            if (status === 'cancelled') updated.cancelledAt = new Date()
          }
          return updated
        })
      } catch (err: unknown) {
        const bookingError: BookingError = adminBookingError(err)
        setMutationError(bookingError.message)
      } finally {
        setMutating(false)
      }
    },
    [applyLocalUpdate],
  )

  const confirm = useCallback(
    (bookingId: string) =>
      runMutation(() => confirmBooking(bookingId), 'confirmed', bookingId),
    [runMutation],
  )

  const cancel = useCallback(
    (bookingId: string, reason?: string) =>
      runMutation(() => cancelBooking(bookingId, reason), 'cancelled', bookingId),
    [runMutation],
  )

  const complete = useCallback(
    (bookingId: string) =>
      runMutation(() => completeBooking(bookingId), 'completed', bookingId),
    [runMutation],
  )

  const noShow = useCallback(
    (bookingId: string) =>
      runMutation(() => markNoShow(bookingId), 'no-show', bookingId),
    [runMutation],
  )

  return useMemo(
    () => ({
      bookings,
      loading,
      error,
      refresh,
      mutating,
      mutationError,
      confirm,
      cancel,
      complete,
      noShow,
    }),
    [
      bookings,
      loading,
      error,
      refresh,
      mutating,
      mutationError,
      confirm,
      cancel,
      complete,
      noShow,
    ],
  )
}
