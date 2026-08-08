import { subDays, subMonths, addDays, addWeeks, addMonths, format, startOfWeek, startOfMonth, parseISO } from 'date-fns'
import type { Booking } from '../../../booking/types'
import { formatDateStr } from '../../../booking/utils/dateHelpers'
import {
  type ReportsKpis,
  type ReportRange,
  type ReportPeriodPreset,
  type TrendPoint,
  type StatusSummaryRow,
  type ServicePerformanceRow,
  type PeakHourRow,
  type WeekdayRow,
  type CustomerGrowthPoint,
  type ReportsDataInput,
  type ReportsData,
} from '../types'

/**
 * Reports & Analytics — pure aggregation service.
 *
 * Every function is a pure computation over the fetched collections
 * (bookings, services, customers). No side effects, no Firestore reads,
 * no state. Designed to be unit-testable and called from the hook.
 */

// ─── Range helpers ──────────────────────────────────────────────────────────

/** Returns today's date as "YYYY-MM-DD". */
function todayISO(): string {
  return formatDateStr(new Date())
}

/** Build a ReportRange from a preset and the earliest available booking date. */
export function getReportRange(
  preset: ReportPeriodPreset,
  earliestBookingDate?: string,
): ReportRange {
  const today = new Date()
  const todayStr = todayISO()

  switch (preset) {
    case '7d':
      return {
        startISO: formatDateStr(subDays(today, 6)),
        endISO: todayStr,
        label: 'Last 7 days',
      }
    case '30d':
      return {
        startISO: formatDateStr(subDays(today, 29)),
        endISO: todayStr,
        label: 'Last 30 days',
      }
    case '90d':
      return {
        startISO: formatDateStr(subDays(today, 89)),
        endISO: todayStr,
        label: 'Last 90 days',
      }
    case '12m':
      return {
        startISO: formatDateStr(subMonths(today, 12)),
        endISO: todayStr,
        label: 'Last 12 months',
      }
    case 'all':
      return {
        startISO: earliestBookingDate ?? formatDateStr(subDays(today, 30)),
        endISO: todayStr,
        label: 'All time',
      }
  }
}

/** Returns true if a booking's preferredDate falls within the range. */
function isBookingInRange(booking: Booking, range: ReportRange): boolean {
  return booking.preferredDate >= range.startISO && booking.preferredDate <= range.endISO
}

/** Returns true if a customer's createdAt falls within the range. */
function isCustomerInRange(
  createdAt: Date | undefined,
  range: ReportRange,
): boolean {
  if (!createdAt) return false
  const dateStr = formatDateStr(createdAt)
  return dateStr >= range.startISO && dateStr <= range.endISO
}

// ─── Bucket helpers ─────────────────────────────────────────────────────────

type BucketGranularity = 'day' | 'week' | 'month'

/** Pick the right granularity based on the range span. */
function pickGranularity(range: ReportRange): BucketGranularity {
  const start = parseISO(range.startISO)
  const end = parseISO(range.endISO)
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  if (days <= 60) return 'day'
  if (days <= 180) return 'week'
  return 'month'
}

/** Returns the bucket key (ISO string) for a booking date at the given granularity. */
function bucketKey(dateISO: string, granularity: BucketGranularity): string {
  const date = parseISO(dateISO)
  switch (granularity) {
    case 'day':
      return dateISO
    case 'week':
      return formatDateStr(startOfWeek(date, { weekStartsOn: 1 }))
    case 'month':
      return formatDateStr(startOfMonth(date))
  }
}

/** Returns a human-readable label for a bucket key. */
function bucketLabel(dateISO: string, granularity: BucketGranularity): string {
  const date = parseISO(dateISO)
  switch (granularity) {
    case 'day':
      return format(date, 'd MMM')
    case 'week':
      return `Wk ${format(date, 'd MMM')}`
    case 'month':
      return format(date, 'MMM yyyy')
  }
}

/** Generate all bucket keys that overlap [startISO, endISO] inclusive. */
function generateBucketKeys(
  startISO: string,
  endISO: string,
  granularity: BucketGranularity,
): string[] {
  const start = parseISO(startISO)
  const end = parseISO(endISO)
  const keys: string[] = []

  // Start at the bucket boundary that contains `start` so a partial first
  // bucket is still represented (its dates overlap the range).
  let current =
    granularity === 'day'
      ? start
      : granularity === 'week'
        ? startOfWeek(start, { weekStartsOn: 1 })
        : startOfMonth(start)

  while (current <= end) {
    keys.push(formatDateStr(current))
    current =
      granularity === 'day'
        ? addDays(current, 1)
        : granularity === 'week'
          ? addWeeks(current, 1)
          : addMonths(current, 1)
  }

  return keys
}

// ─── KPI computation ────────────────────────────────────────────────────────

export function computeKpis(
  input: ReportsDataInput,
  range: ReportRange,
): ReportsKpis {
  const { bookings, customers } = input

  let totalBookings = 0
  let completed = 0
  let pending = 0
  let cancelled = 0
  let noShows = 0
  let revenue = 0
  let expectedRevenue = 0

  for (const booking of bookings) {
    if (!isBookingInRange(booking, range)) continue

    totalBookings++

    switch (booking.status) {
      case 'completed':
        completed++
        revenue += booking.servicePrice
        break
      case 'pending':
        pending++
        expectedRevenue += booking.servicePrice
        break
      case 'confirmed':
        pending++ // confirmed is functionally "pending" for expected revenue
        expectedRevenue += booking.servicePrice
        break
      case 'cancelled':
        cancelled++
        break
      case 'no-show':
        noShows++
        break
    }
  }

  let newCustomers = 0
  for (const customer of customers) {
    if (isCustomerInRange(customer.createdAt, range)) {
      newCustomers++
    }
  }

  return {
    totalBookings,
    completed,
    pending,
    cancelled,
    noShows,
    revenue,
    expectedRevenue,
    avgBookingValue: completed > 0 ? Math.round(revenue / completed) : 0,
    completionRate: totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0,
    cancellationRate: totalBookings > 0 ? Math.round((cancelled / totalBookings) * 100) : 0,
    newCustomers,
  }
}

// ─── Trend computation ──────────────────────────────────────────────────────

export function computeBookingTrend(
  bookings: Booking[],
  range: ReportRange,
): TrendPoint[] {
  const granularity = pickGranularity(range)
  const bucketKeys = generateBucketKeys(range.startISO, range.endISO, granularity)

  // Initialise all buckets.
  const bucketMap = new Map<string, { bookings: number; revenue: number }>()
  for (const key of bucketKeys) {
    bucketMap.set(key, { bookings: 0, revenue: 0 })
  }

  // Fill from bookings.
  for (const booking of bookings) {
    if (!isBookingInRange(booking, range)) continue
    const key = bucketKey(booking.preferredDate, granularity)
    const entry = bucketMap.get(key)
    if (!entry) continue // outside generated range
    entry.bookings++
    if (booking.status === 'completed') {
      entry.revenue += booking.servicePrice
    }
  }

  return bucketKeys.map((key) => ({
    label: bucketLabel(key, granularity),
    dateISO: key,
    bookings: bucketMap.get(key)!.bookings,
    revenue: bucketMap.get(key)!.revenue,
  }))
}

/** Revenue trend is identical to booking trend but only completed revenue matters. */
export function computeRevenueTrend(
  bookings: Booking[],
  range: ReportRange,
): TrendPoint[] {
  // Reuse booking trend — it already computes revenue per bucket.
  return computeBookingTrend(bookings, range)
}

// ─── Status breakdown ───────────────────────────────────────────────────────

export function computeStatusBreakdown(
  bookings: Booking[],
  range: ReportRange,
): StatusSummaryRow[] {
  const counts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    'no-show': 0,
  }

  let total = 0
  for (const booking of bookings) {
    if (!isBookingInRange(booking, range)) continue
    counts[booking.status] = (counts[booking.status] ?? 0) + 1
    total++
  }

  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    'no-show': 'No Show',
  }

  return (Object.entries(counts) as Array<[string, number]>)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status: status as StatusSummaryRow['status'],
      label: labels[status] ?? status,
      count,
      share: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

// ─── Service performance ────────────────────────────────────────────────────

export function computeServicePerformance(
  bookings: Booking[],
  services: ReportsDataInput['services'],
  range: ReportRange,
): ServicePerformanceRow[] {
  const serviceMap = new Map<string, ServicePerformanceRow>()

  // Initialise from all services (even those with 0 bookings).
  for (const svc of services) {
    serviceMap.set(svc.serviceId, {
      serviceId: svc.serviceId,
      name: svc.name,
      category: svc.category,
      bookings: 0,
      completed: 0,
      revenue: 0,
      expectedRevenue: 0,
      avgPrice: 0,
    })
  }

  // Aggregate from bookings.
  for (const booking of bookings) {
    if (!isBookingInRange(booking, range)) continue

    let entry = serviceMap.get(booking.serviceId)
    if (!entry) {
      // Booking references a service that may have been deleted. Adopt the
      // service snapshot stored on the booking so history is still counted.
      entry = {
        serviceId: booking.serviceId,
        name: booking.serviceName,
        category: 'treatment',
        bookings: 0,
        completed: 0,
        revenue: 0,
        expectedRevenue: 0,
        avgPrice: 0,
      }
      serviceMap.set(booking.serviceId, entry)
    }

    entry.bookings++
    if (booking.status === 'completed') {
      entry.completed++
      entry.revenue += booking.servicePrice
    } else if (booking.status === 'pending' || booking.status === 'confirmed') {
      entry.expectedRevenue += booking.servicePrice
    }
  }

  // Compute avgPrice.
  for (const entry of serviceMap.values()) {
    entry.avgPrice = entry.completed > 0 ? Math.round(entry.revenue / entry.completed) : 0
  }

  return [...serviceMap.values()].sort((a, b) => b.bookings - a.bookings)
}

// ─── Peak hours ─────────────────────────────────────────────────────────────

export function computePeakHours(
  bookings: Booking[],
  range: ReportRange,
): PeakHourRow[] {
  const hourCounts = new Array<number>(24).fill(0)

  for (const booking of bookings) {
    if (!isBookingInRange(booking, range)) continue
    const hour = parseInt(booking.preferredTime.split(':')[0], 10)
    if (hour >= 0 && hour < 24) {
      hourCounts[hour]++
    }
  }

  return hourCounts
    .map((count, hour) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      count,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => a.hour - b.hour)
}

// ─── Weekday distribution ───────────────────────────────────────────────────

export function computeWeekdays(
  bookings: Booking[],
  range: ReportRange,
): WeekdayRow[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayCounts = new Array<number>(7).fill(0)
  let total = 0

  for (const booking of bookings) {
    if (!isBookingInRange(booking, range)) continue
    const [year, month, day] = booking.preferredDate.split('-').map(Number)
    const dayOfWeek = new Date(year, month - 1, day).getDay()
    dayCounts[dayOfWeek]++
    total++
  }

  return dayCounts.map((count, day) => ({
    day,
    label: dayNames[day],
    count,
    share: total > 0 ? Math.round((count / total) * 100) : 0,
  }))
}

// ─── Customer growth ────────────────────────────────────────────────────────

export function computeCustomerGrowth(
  customers: ReportsDataInput['customers'],
  range: ReportRange,
): CustomerGrowthPoint[] {
  const granularity = pickGranularity(range)
  const bucketKeys = generateBucketKeys(range.startISO, range.endISO, granularity)

  const bucketMap = new Map<string, number>()
  for (const key of bucketKeys) {
    bucketMap.set(key, 0)
  }

  for (const customer of customers) {
    if (!isCustomerInRange(customer.createdAt, range)) continue
    const key = bucketKey(formatDateStr(customer.createdAt), granularity)
    const current = bucketMap.get(key)
    if (current !== undefined) {
      bucketMap.set(key, current + 1)
    }
  }

  return bucketKeys.map((key) => ({
    dateISO: key,
    label: bucketLabel(key, granularity),
    newCustomers: bucketMap.get(key) ?? 0,
  }))
}

// ─── Earliest booking date ──────────────────────────────────────────────────

/** Find the earliest preferredDate across all bookings. */
export function findEarliestBookingDate(bookings: Booking[]): string | undefined {
  if (bookings.length === 0) return undefined
  return bookings.reduce((earliest, b) =>
    b.preferredDate < earliest ? b.preferredDate : earliest,
    bookings[0].preferredDate,
  )
}

// ─── Full report computation ────────────────────────────────────────────────

/**
 * Compute every report metric for a given range, in a single pass of each
 * collection. Returns the full ReportsData object.
 */
export function computeReports(
  input: ReportsDataInput,
  range: ReportRange,
): ReportsData {
  return {
    kpis: computeKpis(input, range),
    bookingTrend: computeBookingTrend(input.bookings, range),
    revenueTrend: computeRevenueTrend(input.bookings, range),
    statusBreakdown: computeStatusBreakdown(input.bookings, range),
    servicePerformance: computeServicePerformance(input.bookings, input.services, range),
    peakHours: computePeakHours(input.bookings, range),
    weekdays: computeWeekdays(input.bookings, range),
    customerGrowth: computeCustomerGrowth(input.customers, range),
  }
}
