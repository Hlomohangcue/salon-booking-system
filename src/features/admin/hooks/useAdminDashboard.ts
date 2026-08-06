import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Booking } from '../../booking/types'
import { getAllBookings, adminBookingError } from '../services/adminBookingService'
import { BookingError } from '../../booking/errors/bookingErrors'
import { formatDateStr } from '../../booking/utils/dateHelpers'

export interface DashboardStats {
  /** Number of active (pending + confirmed) bookings for today. */
  todayAppointments: number
  /** Number of bookings currently awaiting confirmation. */
  pendingBookings: number
  /** Number of bookings completed today. */
  completedToday: number
}

export interface UpcomingBooking {
  bookingId: string
  time: string
  customerName: string
  serviceName: string
}

export interface UseAdminDashboardReturn {
  loading: boolean
  error: string | null
  stats: DashboardStats
  /** Most recently created bookings (newest first). */
  recentBookings: Booking[]
  /** Today's active bookings sorted by time ascending. */
  upcomingToday: UpcomingBooking[]
  /** Re-fetch bookings from Firestore. */
  refresh: () => Promise<void>
}

/**
 * Loads bookings and derives the dashboard metrics, recent bookings, and the
 * "Upcoming Today" schedule. Keeps the dashboard page free of query logic.
 */
export function useAdminDashboard(): UseAdminDashboardReturn {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const todayStr = useMemo(() => formatDateStr(new Date()), [])

  const stats = useMemo<DashboardStats>(() => {
    const todayActive = bookings.filter(
      (b) =>
        b.preferredDate === todayStr &&
        (b.status === 'pending' || b.status === 'confirmed'),
    )
    const pending = bookings.filter((b) => b.status === 'pending')
    const completedToday = bookings.filter(
      (b) => b.preferredDate === todayStr && b.status === 'completed',
    )

    return {
      todayAppointments: todayActive.length,
      pendingBookings: pending.length,
      completedToday: completedToday.length,
    }
  }, [bookings, todayStr])

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
    [bookings],
  )

  const upcomingToday = useMemo<UpcomingBooking[]>(() => {
    return bookings
      .filter(
        (b) =>
          b.preferredDate === todayStr &&
          (b.status === 'pending' || b.status === 'confirmed'),
      )
      .sort((a, b) => a.preferredTime.localeCompare(b.preferredTime))
      .map((b) => ({
        bookingId: b.bookingId,
        time: b.preferredTime,
        customerName: b.customerName,
        serviceName: b.serviceName,
      }))
  }, [bookings, todayStr])

  return useMemo(
    () => ({
      loading,
      error,
      stats,
      recentBookings,
      upcomingToday,
      refresh,
    }),
    [loading, error, stats, recentBookings, upcomingToday, refresh],
  )
}
