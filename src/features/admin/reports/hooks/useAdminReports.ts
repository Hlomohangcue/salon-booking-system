import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Booking, Customer, Service } from '../../../booking/types'
import { getAllBookings } from '../../services/adminBookingService'
import { getServices } from '../../services/adminServiceService'
import { getCustomers } from '../../services/adminCustomerService'
import {
  computeReports,
  findEarliestBookingDate,
  getReportRange,
} from '../services/adminReportsService'
import { BookingError, toBookingError } from '../../../booking/errors/bookingErrors'
import type { ReportsData, ReportPeriodPreset, ReportRange } from '../types'

/** Stable error wrapper matching the admin module conventions. */
export function reportsError(error: unknown): BookingError {
  return toBookingError(error)
}

export interface UseAdminReportsReturn {
  /** True while the initial fetch is in flight. */
  loading: boolean
  /** Human-readable load error, or null when idle/success. */
  error: string | null
  /** The active period preset. */
  period: ReportPeriodPreset
  /** The resolved inclusive date range for the active period. */
  range: ReportRange
  /** All derived report data for the active range. */
  data: ReportsData
  /** The raw fetched collections (available for future export). */
  source: {
    bookings: Booking[]
    services: Service[]
    customers: Customer[]
  }
  /** Re-fetch bookings, services and customers from Firestore. */
  refresh: () => Promise<void>
  /** Switch the report period (re-computes in-memory, no re-fetch). */
  setPeriod: (preset: ReportPeriodPreset) => void
}

/**
 * Reports & Analytics hook.
 *
 * Loads bookings, services and customers exactly once (in parallel) and
 * derives every report metric through the pure service functions. Period
 * changes are resolved entirely in memory — no extra Firestore reads.
 */
export function useAdminReports(): UseAdminReportsReturn {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriodState] = useState<ReportPeriodPreset>('30d')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [bookingData, serviceData, customerData] = await Promise.all([
        getAllBookings(),
        getServices(),
        getCustomers(),
      ])
      setBookings(bookingData)
      setServices(serviceData)
      setCustomers(customerData)
    } catch (err: unknown) {
      setError(reportsError(err).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setPeriod = useCallback((preset: ReportPeriodPreset) => {
    setPeriodState(preset)
  }, [])

  const range = useMemo<ReportRange>(() => {
    const earliest = findEarliestBookingDate(bookings)
    return getReportRange(period, earliest)
  }, [period, bookings])

  const source = useMemo(
    () => ({ bookings, services, customers }),
    [bookings, services, customers],
  )

  const data = useMemo<ReportsData>(
    () => computeReports(source, range),
    [source, range],
  )

  return useMemo(
    () => ({
      loading,
      error,
      period,
      range,
      data,
      source,
      refresh,
      setPeriod,
    }),
    [loading, error, period, range, data, source, refresh, setPeriod],
  )
}

