import { db } from '../../../lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import type { Booking, BookingFormValues, BookingDocument } from '../types'
import { FIRESTORE_COLLECTIONS } from '../types'

// Converts raw Firestore Timestamps to JavaScript Date objects
function fromFirestore(data: BookingDocument): Booking {
  return {
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    confirmedAt: data.confirmedAt?.toDate(),
    cancelledAt: data.cancelledAt?.toDate(),
  } as Booking
}

/**
 * Fetch a single booking by its Firestore document ID.
 * Returns null if no booking exists with that ID.
 */
export async function getBooking(bookingId: string): Promise<Booking | null> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.BOOKINGS, bookingId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return fromFirestore(snap.data() as BookingDocument)
}

/**
 * Fetch all active bookings (pending or confirmed) for a given date,
 * ordered by start time ascending.
 *
 * @param date - ISO date string "YYYY-MM-DD"
 */
export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.BOOKINGS),
    where('preferredDate', '==', date),
    where('status', 'in', ['pending', 'confirmed']),
    orderBy('preferredTime', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => fromFirestore(d.data() as BookingDocument))
}

/**
 * Create a new booking using a Firestore transaction to prevent double-bookings.
 *
 * Phase 3.2 implementation plan:
 *   1. Open runTransaction()
 *   2. Re-query booked slots inside the transaction (snapshot read)
 *   3. Run generateAvailableSlots() to verify the slot is still free
 *   4. If available → write the booking document + update updatedAt via serverTimestamp()
 *   5. If unavailable → throw an error; the transaction aborts automatically
 *
 * The transaction guarantees atomicity even under concurrent submissions.
 * See docs/FIRESTORE_SECURITY.md — Transaction Strategy.
 *
 * @returns The new Firestore document ID (used as the customer's booking reference)
 */
export async function createBooking(_data: BookingFormValues): Promise<string> {
  throw new Error('[bookings] createBooking: not yet implemented — requires Firestore transaction')
}

/**
 * Cancel a booking by updating its status and recording the cancellation reason.
 * Phase 3.2: Implement with a field-level update (status, cancelledAt, cancellationReason only).
 */
export async function cancelBooking(
  _bookingId: string,
  _reason: string,
): Promise<void> {
  throw new Error('[bookings] cancelBooking: not yet implemented')
}
