import type { ReportsData } from '../../features/admin/reports/types'
import { makeBooking } from './booking'
import { makeCustomer } from './customer'
import { makeService } from './service'

/**
 * A small, internally-consistent dataset used to exercise the reports
 * aggregation service deterministically.
 */
export function makeReportDataset() {
  const services = [
    makeService({ serviceId: 'svc-haircut', name: 'Haircut', priceFrom: 150, durationMinutes: 30, category: 'hair' }),
    makeService({ serviceId: 'svc-beard', name: 'Beard Grooming', priceFrom: 100, durationMinutes: 20, category: 'beard' }),
  ]

  const customers = [
    makeCustomer({ customerId: '+26652000001', phoneNumber: '+26652000001', createdAt: new Date('2026-08-01T00:00:00.000Z') }),
    makeCustomer({ customerId: '+26652000002', phoneNumber: '+26652000002', createdAt: new Date('2026-08-10T00:00:00.000Z') }),
  ]

  const bookings = [
    // Completed this week (revenue 150)
    makeBooking({
      bookingId: 'bk-1',
      serviceId: 'svc-haircut',
      serviceName: 'Haircut',
      servicePrice: 150,
      preferredDate: '2026-08-03',
      preferredTime: '09:00',
      status: 'completed',
      completedAt: new Date('2026-08-03T09:30:00.000Z'),
    }),
    // Completed (revenue 100)
    makeBooking({
      bookingId: 'bk-2',
      serviceId: 'svc-beard',
      serviceName: 'Beard Grooming',
      servicePrice: 100,
      preferredDate: '2026-08-04',
      preferredTime: '10:00',
      status: 'completed',
      completedAt: new Date('2026-08-04T10:20:00.000Z'),
    }),
    // Pending (expected revenue 150)
    makeBooking({
      bookingId: 'bk-3',
      serviceId: 'svc-haircut',
      serviceName: 'Haircut',
      servicePrice: 150,
      preferredDate: '2026-08-05',
      preferredTime: '11:00',
      status: 'pending',
    }),
    // Cancelled (no revenue)
    makeBooking({
      bookingId: 'bk-4',
      serviceId: 'svc-haircut',
      serviceName: 'Haircut',
      servicePrice: 150,
      preferredDate: '2026-08-06',
      preferredTime: '12:00',
      status: 'cancelled',
      cancelledAt: new Date('2026-08-06T08:00:00.000Z'),
    }),
    // No-show (no revenue)
    makeBooking({
      bookingId: 'bk-5',
      serviceId: 'svc-beard',
      serviceName: 'Beard Grooming',
      servicePrice: 100,
      preferredDate: '2026-08-07',
      preferredTime: '13:00',
      status: 'no-show',
    }),
  ]

  return { bookings, services, customers }
}

/** A realistic ReportsData snapshot for component rendering tests. */
export function makeReportsData(): ReportsData {
  return {
    kpis: {
      totalBookings: 5,
      completed: 2,
      pending: 1,
      cancelled: 1,
      noShows: 1,
      revenue: 250,
      expectedRevenue: 150,
      avgBookingValue: 125,
      completionRate: 40,
      cancellationRate: 20,
      newCustomers: 2,
    },
    bookingTrend: [
      { label: '3 Aug', dateISO: '2026-08-03', bookings: 1, revenue: 150 },
      { label: '4 Aug', dateISO: '2026-08-04', bookings: 1, revenue: 100 },
    ],
    revenueTrend: [
      { label: '3 Aug', dateISO: '2026-08-03', bookings: 1, revenue: 150 },
      { label: '4 Aug', dateISO: '2026-08-04', bookings: 1, revenue: 100 },
    ],
    statusBreakdown: [
      { status: 'completed', label: 'Completed', count: 2, share: 40 },
      { status: 'cancelled', label: 'Cancelled', count: 1, share: 20 },
    ],
    servicePerformance: [
      {
        serviceId: 'svc-haircut',
        name: 'Haircut',
        category: 'hair',
        bookings: 3,
        completed: 1,
        revenue: 150,
        expectedRevenue: 150,
        avgPrice: 150,
      },
      {
        serviceId: 'svc-beard',
        name: 'Beard Grooming',
        category: 'beard',
        bookings: 2,
        completed: 1,
        revenue: 100,
        expectedRevenue: 0,
        avgPrice: 100,
      },
    ],
    peakHours: [
      { hour: 9, label: '09:00', count: 1 },
      { hour: 10, label: '10:00', count: 1 },
    ],
    weekdays: [
      { day: 1, label: 'Mon', count: 1, share: 20 },
      { day: 2, label: 'Tue', count: 1, share: 20 },
    ],
    customerGrowth: [
      { dateISO: '2026-08-01', label: '1 Aug', newCustomers: 1 },
      { dateISO: '2026-08-10', label: '10 Aug', newCustomers: 1 },
    ],
  }
}
