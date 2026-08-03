import { db } from '../../../lib/firebase'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import type { Service, BookingConfig } from '../types'
import { FIRESTORE_COLLECTIONS } from '../types'

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
 * Phase 3.2 implementation plan:
 *   1. Call getBookingConfig() for openingHours and minAdvanceHours
 *   2. Call getBookedSlots(date) to get current active bookings
 *   3. Pass both to generateAvailableSlots() and check if `time` is in the result
 *
 * IMPORTANT: This must also be verified inside the createBooking() Firestore transaction
 * to protect against race conditions on the last available slot.
 */
export async function checkAvailability(
  _date: string,
  _time: string,
  _serviceDurationMins: number,
): Promise<boolean> {
  throw new Error('[bookings] checkAvailability: not yet implemented')
}
