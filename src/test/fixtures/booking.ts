import type { Booking, BookingConfig, BookingDocument, BookingFormValues } from '../../features/booking/types'
import type { Timestamp } from 'firebase/firestore'

/** A fake Firestore Timestamp that converts to a fixed Date. */
export function makeTimestamp(date: Date): Timestamp {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    isEqual: () => false,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
  } as unknown as Timestamp
}

let bookingCounter = 0

/** Build a fully-populated Booking with sensible defaults; override per test. */
export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  bookingCounter += 1
  const id = overrides.bookingId ?? `bk-${bookingCounter}`
  const now = new Date('2026-08-05T10:00:00.000Z')
  return {
    bookingId: id,
    customerName: 'Amara Nkosi',
    phoneNumber: '+26652000001',
    serviceId: 'svc-haircut',
    serviceName: 'Haircut',
    serviceDuration: 30,
    servicePrice: 150,
    preferredDate: '2026-08-05',
    preferredTime: '09:00',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    email: 'amara@example.com',
    notes: '',
    source: 'web',
    ...overrides,
  }
}

/** Build a raw BookingDocument (Timestamp fields) for converter tests. */
export function makeBookingDocument(
  overrides: Partial<BookingDocument> = {},
): BookingDocument {
  const base = makeBooking()
  const createdAt = new Date('2026-08-05T10:00:00.000Z')
  const updatedAt = new Date('2026-08-05T10:00:00.000Z')
  return {
    bookingId: base.bookingId,
    customerName: base.customerName,
    phoneNumber: base.phoneNumber,
    serviceId: base.serviceId,
    serviceName: base.serviceName,
    serviceDuration: base.serviceDuration,
    servicePrice: base.servicePrice,
    preferredDate: base.preferredDate,
    preferredTime: base.preferredTime,
    status: base.status,
    source: base.source,
    createdAt: makeTimestamp(createdAt),
    updatedAt: makeTimestamp(updatedAt),
    ...overrides,
  }
}

/** Build a BookingFormValues for createBooking tests. */
export function makeBookingFormValues(
  overrides: Partial<BookingFormValues> = {},
): BookingFormValues {
  return {
    serviceId: 'svc-haircut',
    preferredDate: '2026-08-05',
    preferredTime: '09:00',
    customerName: 'Amara Nkosi',
    phoneNumber: '+26652000001',
    email: 'amara@example.com',
    notes: '',
    ...overrides,
  }
}

/** A default BookingConfig that generates a full day of 30-min slots, 09:00–17:00. */
export function makeBookingConfig(
  overrides: Partial<BookingConfig> = {},
): BookingConfig {
  const openingHours = {
    mon: { open: '09:00', close: '17:00' },
    tue: { open: '09:00', close: '17:00' },
    wed: { open: '09:00', close: '17:00' },
    thu: { open: '09:00', close: '17:00' },
    fri: { open: '09:00', close: '17:00' },
    sat: { open: '09:00', close: '13:00' },
    sun: { open: '09:00', close: '13:00' },
  } as BookingConfig['openingHours']
  return {
    openingHours,
    slotIntervalMins: 30,
    bookingWindowDays: 30,
    minAdvanceHours: 0,
    maxBookingsPerSlot: 1,
    holidays: [],
    ...overrides,
  }
}
