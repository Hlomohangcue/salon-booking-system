import type { Booking, BookingStatus, Customer, Service } from '../../booking/types'

/**
 * Reports & Analytics module types.
 *
 * All report derivations are computed from the live `bookings`, `services`
 * and `customers` collections by pure functions in
 * `services/adminReportsService.ts`. Nothing here is persisted.
 */

/** Preset time windows the admin can pick from. */
export type ReportPeriodPreset = '7d' | '30d' | '90d' | '12m' | 'all'

/** An inclusive ISO-date range (local calendar dates, "YYYY-MM-DD"). */
export interface ReportRange {
  /** Inclusive start date, "YYYY-MM-DD". */
  startISO: string
  /** Inclusive end date, "YYYY-MM-DD". */
  endISO: string
  /** Human-readable label, e.g. "Last 30 days". */
  label: string
}

/** Key performance indicators for the selected range. */
export interface ReportsKpis {
  /** Bookings of every status in the range. */
  totalBookings: number
  completed: number
  pending: number
  cancelled: number
  noShows: number
  /** Sum of booking.servicePrice for completed bookings only. */
  revenue: number
  /** Sum of booking.servicePrice for pending + confirmed bookings. */
  expectedRevenue: number
  /** revenue / completed (0 when no completed bookings). */
  avgBookingValue: number
  /** completed / totalBookings * 100 (0 when none). */
  completionRate: number
  /** cancelled / totalBookings * 100 (0 when none). */
  cancellationRate: number
  /** Customers whose metadata document was created within the range. */
  newCustomers: number
}

/** A single bucketed point in a time-series report. */
export interface TrendPoint {
  /** Human-readable bucket label, e.g. "5 Aug" or "Aug 2026". */
  label: string
  /** ISO string for the bucket start — used as the grouping key. */
  dateISO: string
  /** Number of bookings in the bucket. */
  bookings: number
  /** Revenue from completed bookings in the bucket. */
  revenue: number
}

/** A simple labelled value — the common chart series shape. */
export interface SeriesPoint {
  label: string
  value: number
}

/** One row of the Service Performance table. */
export interface ServicePerformanceRow {
  serviceId: string
  name: string
  category: string
  /** Total bookings for the service in the range. */
  bookings: number
  /** Completed bookings for the service in the range. */
  completed: number
  /** Sum of servicePrice for completed bookings of this service. */
  revenue: number
  /** Sum of servicePrice for pending + confirmed bookings of this service. */
  expectedRevenue: number
  /** revenue / completed (0 when none). */
  avgPrice: number
}

/** One row of the Booking Status Summary. */
export interface StatusSummaryRow {
  status: BookingStatus
  /** Capitalised label, e.g. "No Show". */
  label: string
  count: number
  /** count / total * 100. */
  share: number
}

/** One row of the Peak Booking Hours analysis. */
export interface PeakHourRow {
  /** 0–23. */
  hour: number
  /** e.g. "09:00". */
  label: string
  count: number
}

/** One row of the Busiest Weekdays analysis. */
export interface WeekdayRow {
  /** 0 (Sunday) – 6 (Saturday), matching Date#getDay(). */
  day: number
  /** e.g. "Mon". */
  label: string
  count: number
  /** count / total * 100. */
  share: number
}

/** One bucketed point of the New Customer Growth report. */
export interface CustomerGrowthPoint {
  dateISO: string
  label: string
  newCustomers: number
}

/** Everything the Reports page renders for a selected period. */
export interface ReportsData {
  kpis: ReportsKpis
  bookingTrend: TrendPoint[]
  revenueTrend: TrendPoint[]
  statusBreakdown: StatusSummaryRow[]
  servicePerformance: ServicePerformanceRow[]
  peakHours: PeakHourRow[]
  weekdays: WeekdayRow[]
  customerGrowth: CustomerGrowthPoint[]
}

/** Raw collections fetched once by the reports hook. */
export interface ReportsDataInput {
  bookings: Booking[]
  services: Service[]
  customers: Customer[]
}

