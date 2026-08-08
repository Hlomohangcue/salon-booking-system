import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Booking, Customer } from '../../booking/types'
import {
  getCustomers,
  archiveCustomer,
  restoreCustomer,
  adminCustomerError,
} from '../services/adminCustomerService'
import { getAllBookings } from '../services/adminBookingService'
import { BookingError } from '../../booking/errors/bookingErrors'
import { formatDateStr, parseDateStr } from '../../booking/utils/dateHelpers'

/**
 * A customer with booking-derived statistics.
 *
 * Statistics are never stored on the customer document — they are computed
 * from the bookings collection and memoized here.
 */
export interface CustomerWithStats extends Customer {
  /** Total bookings across all time (all statuses). */
  totalBookings: number
  /** Most recent appointment date, or null if the customer has no bookings. */
  lastVisit: Date | null
  /** Number of upcoming (pending/confirmed, today or later) appointments. */
  upcomingCount: number
}

export interface UseAdminCustomersReturn {
  /** All customers, sorted by name ascending, with derived stats. */
  customers: CustomerWithStats[]
  loading: boolean
  /** Human-readable load error, or null when idle/success. */
  error: string | null
  /** Re-fetch customers + bookings from Firestore. */
  refresh: () => Promise<void>
  /** Whether a mutation is currently in flight. */
  mutating: boolean
  /** Mutation error message scoped to the last action. */
  mutationError: string | null
  /** Archive a customer (hides them from the active list). */
  archiveCustomerAction: (customerId: string) => Promise<void>
  /** Restore a previously archived customer. */
  restoreCustomerAction: (customerId: string) => Promise<void>
  /** Cached bookings for a customer (no extra Firestore read). */
  getBookingsForCustomer: (customerId: string) => Booking[]
}

/**
 * Loads customer metadata and derives per-customer statistics from bookings.
 *
 * A single bookings fetch is performed on refresh and cached per customer so
 * the detail panel never triggers duplicate Firestore reads. All derived data
 * is memoized; there is no polling — refresh only runs on mount and on an
 * explicit user action.
 */
export function useAdminCustomers(): UseAdminCustomersReturn {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [bookingsByCustomer, setBookingsByCustomer] = useState<Record<string, Booking[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Single parallel read: customer metadata + all bookings (source of
      // truth for activity). No per-customer booking queries are needed.
      const [customerDocs, allBookings] = await Promise.all([
        getCustomers(),
        getAllBookings(),
      ])

      // Group bookings by normalized phone number (the customer natural key).
      const grouped: Record<string, Booking[]> = {}
      for (const booking of allBookings) {
        const key = booking.phoneNumber
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(booking)
      }

      const todayStr = formatDateStr(new Date())

      const withStats: CustomerWithStats[] = customerDocs.map((customer) => {
        const bookings = grouped[customer.phoneNumber] ?? []
        const upcoming = bookings.filter(
          (b) =>
            b.preferredDate >= todayStr &&
            (b.status === 'pending' || b.status === 'confirmed'),
        )
        const lastVisitDate = bookings.reduce<string | null>((latest, b) => {
          if (latest === null || b.preferredDate > latest) return b.preferredDate
          return latest
        }, null)

        return {
          ...customer,
          totalBookings: bookings.length,
          lastVisit: lastVisitDate ? parseDateStr(lastVisitDate) : null,
          upcomingCount: upcoming.length,
        }
      })

      setCustomers(withStats)
      setBookingsByCustomer(grouped)
    } catch (err: unknown) {
      const bookingError: BookingError = adminCustomerError(err)
      setError(bookingError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const getBookingsForCustomer = useCallback(
    (customerId: string): Booking[] => bookingsByCustomer[customerId] ?? [],
    [bookingsByCustomer],
  )

  const runMutation = useCallback(
    async (
      action: (customerId: string) => Promise<void>,
      customerId: string,
      archived: boolean,
    ) => {
      setMutating(true)
      setMutationError(null)
      try {
        await action(customerId)
        // Optimistically reflect the archive/restore in local state.
        setCustomers((prev) =>
          prev.map((c) =>
            c.customerId === customerId
              ? { ...c, archived, updatedAt: new Date() }
              : c,
          ),
        )
      } catch (err: unknown) {
        const bookingError: BookingError = adminCustomerError(err)
        setMutationError(bookingError.message)
      } finally {
        setMutating(false)
      }
    },
    [],
  )

  const archiveCustomerAction = useCallback(
    (customerId: string) => runMutation(archiveCustomer, customerId, true),
    [runMutation],
  )

  const restoreCustomerAction = useCallback(
    (customerId: string) => runMutation(restoreCustomer, customerId, false),
    [runMutation],
  )

  return useMemo(
    () => ({
      customers,
      loading,
      error,
      refresh,
      mutating,
      mutationError,
      archiveCustomerAction,
      restoreCustomerAction,
      getBookingsForCustomer,
    }),
    [
      customers,
      loading,
      error,
      refresh,
      mutating,
      mutationError,
      archiveCustomerAction,
      restoreCustomerAction,
      getBookingsForCustomer,
    ],
  )
}
