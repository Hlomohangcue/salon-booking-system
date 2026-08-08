import { db } from '../../../lib/firebase'
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import {
  FIRESTORE_COLLECTIONS,
  type Booking,
  type BookingDocument,
  type BookingStatus,
} from '../../booking/types'
import { BookingError, toBookingError } from '../../booking/errors/bookingErrors'

/**
 * Admin booking management service.
 *
 * All booking-mutation operations for the admin dashboard live here and are
 * invoked only by authenticated admins. These rely on the Firestore security
 * rules that gate `update` on `bookings` behind `isAdmin()`.
 *
 * The customer-facing create flow remains in
 * `src/features/booking/services/bookingService.ts` and is untouched.
 */

// Converts raw Firestore Timestamps to JavaScript Date objects.
function fromFirestore(data: BookingDocument): Booking {
  return {
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    confirmedAt: data.confirmedAt?.toDate(),
    cancelledAt: data.cancelledAt?.toDate(),
    completedAt: data.completedAt?.toDate(),
  } as Booking
}

/**
 * Fetch all bookings, newest first. Sorting is client-facing convenience; the
 * dataset is small enough that a single orderBy suffices.
 */
export async function getAllBookings(): Promise<Booking[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.BOOKINGS),
    orderBy('preferredDate', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => fromFirestore(d.data() as BookingDocument))
}

/**
 * Fetch bookings for a specific preferred date (ISO "YYYY-MM-DD").
 */
export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const snap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.BOOKINGS))
  return snap.docs
    .map((d) => fromFirestore(d.data() as BookingDocument))
    .filter((b) => b.preferredDate === date)
}

/**
 * Applies a status transition to a booking, updating status and timestamps.
 * Respects the security rule that only admins may update bookings.
 */
async function setBookingStatus(
  bookingId: string,
  status: BookingStatus,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.BOOKINGS, bookingId)
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
    ...extra,
  })
}

/** Confirm a previously pending booking. */
export async function confirmBooking(bookingId: string): Promise<void> {
  await setBookingStatus(bookingId, 'confirmed', {
    confirmedAt: serverTimestamp(),
  })
}

/**
 * Cancel a booking, recording the reason and cancellation timestamp.
 * @param reason - Optional human-readable cancellation reason.
 */
export async function cancelBooking(
  bookingId: string,
  reason?: string,
): Promise<void> {
  await setBookingStatus(bookingId, 'cancelled', {
    cancelledAt: serverTimestamp(),
    cancellationReason: reason ? String(reason).slice(0, 500) : null,
  })
}

/** Mark a booking as completed. */
export async function completeBooking(bookingId: string): Promise<void> {
  await setBookingStatus(bookingId, 'completed', {
    completedAt: serverTimestamp(),
  })
}

/** Mark a booking as a no-show. */
export async function markNoShow(bookingId: string): Promise<void> {
  await setBookingStatus(bookingId, 'no-show')
}

/**
 * Wraps a mutation so callers always get a BookingError with a stable code
 * rather than a raw Firebase error.
 */
export function adminBookingError(error: unknown): BookingError {
  return toBookingError(error)
}
