import { db } from '../../../lib/firebase'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import type { Service, BookingConfig } from '../types'
import { FIRESTORE_COLLECTIONS } from '../types'
import { generateAvailableSlots } from '../utils/slotGenerator'

/** Result of an availability check. */
export interface AvailabilityResult {
  available: boolean
  /** When false, a short human-readable explanation of why the slot is unavailable. */
  reason?: string
}

/**
 * Fetch all active services from Firestore, sorted by sortOrder ascending.
 * Sorting is done client-side to avoid requiring a composite Firestore index.
 */
export async function getServices(): Promise<Service[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.SERVICES),
    where('isActive', '==', true),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ serviceId: d.id, ...d.data() } as Service))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Fetch the global booking configuration.
 * Stored as a singleton document at settings/bookingConfig.
 * Throws if the document does not exist — the salon owner must seed it first.
 */
export async function getBookingConfig(): Promise<BookingConfig> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'bookingConfig')
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    throw new Error('Booking configuration not found. Seed the settings/bookingConfig document in Firestore.')
  }
  return snap.data() as BookingConfig
}

/**
 * Returns the booked start times ("HH:MM") for a given date.
 * Only counts active bookings (pending or confirmed) — cancelled / no-show are excluded.
 *
 * Used by generateAvailableSlots() to remove already-booked times from the grid.
 *
 * @param date - ISO date string "YYYY-MM-DD"
 */
export async function getBookedSlots(date: string): Promise<string[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.BOOKINGS),
    where('preferredDate', '==', date),
    where('status', 'in', ['pending', 'confirmed']),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data().preferredTime as string)
}

/**
 * Check whether a specific slot is available for a given date and service duration.
 *
 * Uses the existing booking configuration and slot-generation utilities to
 * account for opening hours, holidays, the advance booking window, the service
 * duration, and already-booked slots.
 *
 * IMPORTANT: This must also be verified inside the createBooking() Firestore
 * transaction to protect against race conditions on the last available slot.
 *
 * @param date - ISO date string "YYYY-MM-DD"
 * @param time - 24-hour "HH:MM" start time being requested
 * @param serviceDurationMins - length of the service in minutes
 */
export async function checkAvailability(
  date: string,
  time: string,
  serviceDurationMins: number,
): Promise<AvailabilityResult> {
  const config = await getBookingConfig()
  const bookedSlots = await getBookedSlots(date)

  const availableSlots = generateAvailableSlots({
    date,
    config,
    serviceDurationMins,
    bookedSlots,
  })

  if (!availableSlots.includes(time)) {
    return {
      available: false,
      reason: 'That time slot is no longer available. Please choose another time.',
    }
  }

  return { available: true }
}
