import type { Timestamp } from 'firebase/firestore'

// ─── Primitive types ────────────────────────────────────────────────────────

/** "no-show" included for future tracking of missed appointments */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show'
export type BookingSource = 'web' | 'admin' | 'whatsapp'
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type ServiceCategory = 'hair' | 'beard' | 'makeup' | 'treatment'

// ─── Booking config — stored at settings/bookingConfig ─────────────────────

export interface DayHours {
  /** "HH:MM" 24-hour opening time */
  open: string
  /** "HH:MM" 24-hour closing time */
  close: string
  /** When true the salon is fully closed on this weekday */
  closed?: boolean
}

export interface BookingConfig {
  openingHours: Record<DayOfWeek, DayHours>
  /** Slot grid granularity in minutes (e.g. 30) */
  slotIntervalMins: number
  /** How many days ahead a customer can book */
  bookingWindowDays: number
  /** Minimum hours in advance a slot can be booked */
  minAdvanceHours: number
  /** Max simultaneous bookings per slot — typically 1 for a single-operator salon */
  maxBookingsPerSlot: number
  /** ISO date strings "YYYY-MM-DD" — holidays and special closed days */
  holidays: string[]
  /**
   * Buffer minutes enforced between appointments (Phase 3.7).
   * When undefined, no buffer is applied (backward compatible).
   */
  bufferBetweenAppointmentsMins?: number
  /**
   * Maximum allowed bookings per day (Phase 3.7).
   * When undefined, no per-day cap is applied (backward compatible).
   */
  maxBookingsPerDay?: number
  /**
   * "HH:MM" after which same-day bookings are cut off (Phase 3.7).
   * When undefined, no same-day cutoff is applied (backward compatible).
   */
  sameDayCutoffTime?: string
}

// ─── Service — stored at services/{serviceId} ───────────────────────────────

export interface Service {
  serviceId: string
  name: string
  description: string
  /** Appointment length in minutes — drives the slot blocking calculation */
  durationMinutes: number
  /** Minimum price in local currency (Lesotho loti / ZAR) */
  priceFrom: number
  /** false hides the service from the customer-facing booking form */
  isActive: boolean
  category: ServiceCategory
  /** Controls display order in the services list */
  sortOrder: number
  createdAt: Date
}

// ─── Booking — stored at bookings/{bookingId} ───────────────────────────────

export interface Booking {
  /** Same as the Firestore document ID — denormalised for client queries */
  bookingId: string
  customerName: string
  /** E.164 format: +266XXXXXXXX (Lesotho) */
  phoneNumber: string
  email?: string
  serviceId: string
  /** Snapshot of service name at booking time — survives future service edits */
  serviceName: string
  /** Snapshot of service duration at booking time */
  serviceDuration: number
  /** Snapshot of service price at booking time — survives future service edits */
  servicePrice: number
  /** ISO date string "YYYY-MM-DD" — avoids Timestamp timezone drift */
  preferredDate: string
  /** 24-hour time string "HH:MM" */
  preferredTime: string
  status: BookingStatus
  createdAt: Date
  updatedAt: Date
  notes?: string
  // Future-ready fields — undefined until the relevant feature phase is built
  staffId?: string
  branchId?: string
  confirmedAt?: Date
  cancelledAt?: Date
  completedAt?: Date
  cancellationReason?: string
  source: BookingSource
}

/**
 * Raw shape of a Booking document as received from Firestore.
 * Timestamp fields are converted to Date by fromFirestore() in bookingService.ts.
 */
export interface BookingDocument
  extends Omit<
    Booking,
    'createdAt' | 'updatedAt' | 'confirmedAt' | 'cancelledAt' | 'completedAt'
  > {
  createdAt: Timestamp
  updatedAt: Timestamp
  confirmedAt?: Timestamp
  cancelledAt?: Timestamp
  completedAt?: Timestamp
}

// ─── Customer — stored at customers/{phoneNumber} ───────────────────────────

export interface Customer {
  /** Same as the Firestore document ID — the E.164 phone number. */
  customerId: string
  customerName: string
  /** E.164 format: +266XXXXXXXX (Lesotho) */
  phoneNumber: string
  email?: string
  /** When true the customer is hidden from the active admin list. */
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Raw shape of a Customer document as received from Firestore.
 * Timestamp fields are converted to Date by fromFirestore() in
 * adminCustomerService.ts.
 */
export interface CustomerDocument
  extends Omit<Customer, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Booking form values — used by the wizard (Phase 3.2) ──────────────────

export interface BookingFormValues {
  serviceId: string
  /** "YYYY-MM-DD" */
  preferredDate: string
  /** "HH:MM" 24-hour */
  preferredTime: string
  customerName: string
  /** Raw user input — normalised to E.164 before writing to Firestore */
  phoneNumber: string
  email?: string
  notes?: string
}

// ─── Firestore collection names — single source of truth ───────────────────

export const FIRESTORE_COLLECTIONS = {
  BOOKINGS: 'bookings',
  SERVICES: 'services',
  SETTINGS: 'settings',
  USERS: 'users',
  CUSTOMERS: 'customers',
} as const
