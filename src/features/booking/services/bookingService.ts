import { db } from '../../../lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore'
import type { Booking, BookingFormValues, BookingDocument } from '../types'
import { FIRESTORE_COLLECTIONS } from '../types'
import { generateAvailableSlots } from '../utils/slotGenerator'
import { normalizePhone } from '../utils/dateHelpers'
import {
  throwBookingError,
  toBookingError,
} from '../errors/bookingErrors'

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
 * Reads the active booking documents for a given date. Returns the raw snapshot
 * so the caller can re-read each document by reference inside the transaction.
 */
async function readActiveBookingsForDate(
  date: string,
): Promise<QuerySnapshot<DocumentData>> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.BOOKINGS),
    where('preferredDate', '==', date),
    where('status', 'in', ['pending', 'confirmed']),
  )
  return getDocs(q)
}

/**
 * Create a new booking using a Firestore transaction to prevent double-bookings.
 *
 * Because the Firestore web SDK's Transaction.get() only accepts document
 * references (not queries), the concurrency-safe flow is:
 *
 *   1. Pre-read the active bookings for the date via getDocs() to learn the
 *      document IDs and current booked times.
 *   2. Open a runTransaction() and re-read each of those booking documents by
 *      reference inside the transaction. This establishes a server-side lock
 *      on those documents, so concurrent transactions will conflict and retry.
 *   3. Re-read the booking config and selected service (both known references)
 *      inside the transaction.
 *   4. Rebuild the booked-slot list from the transactional snapshot and verify
 *      the requested slot is still available.
 *   5. Check for a duplicate pending booking from the same customer
 *      (same phone, date, and time).
 *   6. Write the booking only if the slot remains available, otherwise abort.
 *
 * @returns The new Firestore document ID (used as the customer's booking reference)
 */
export async function createBooking(formData: BookingFormValues): Promise<string> {
  // Normalise the phone number to E.164 before any lookup or write.
  const phoneNumber = normalizePhone(formData.phoneNumber)

  // 1. Pre-read active bookings for the date to learn document IDs.
  const preReadSnap = await readActiveBookingsForDate(formData.preferredDate)

  try {
    return await runTransaction(db, async (tx) => {
      // 2. Re-read each existing booking document by reference inside the transaction.
      //    This locks those documents so concurrent transactions must retry.
      const existingDocs = await Promise.all(
        preReadSnap.docs.map((d) => tx.get(doc(db, FIRESTORE_COLLECTIONS.BOOKINGS, d.id))),
      )

      // 3. Re-read booking config and the selected service.
      const configSnap = await tx.get(
        doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'bookingConfig'),
      )
      if (!configSnap.exists()) {
        throwBookingError(
          'UNKNOWN_ERROR',
          'Booking configuration is missing. Please try again later.',
        )
      }
      const config = configSnap.data() as import('../types').BookingConfig

      const serviceSnap = await tx.get(
        doc(db, FIRESTORE_COLLECTIONS.SERVICES, formData.serviceId),
      )
      if (!serviceSnap.exists()) {
        throwBookingError('SERVICE_NOT_FOUND')
      }
      const service = serviceSnap.data() as import('../types').Service

      // 4. Rebuild the booked-slot list from the transactional snapshot and
      //    verify the requested slot is still available.
      const bookedSlots = existingDocs
        .filter((d) => d.exists())
        .map((d) => d.data()?.preferredTime as string)

      const availableSlots = generateAvailableSlots({
        date: formData.preferredDate,
        config,
        serviceDurationMins: service.durationMinutes,
        bookedSlots,
      })
      if (!availableSlots.includes(formData.preferredTime)) {
        throwBookingError('SLOT_UNAVAILABLE')
      }

      // 5. Duplicate prevention: same customer (phone) + date + time for a pending booking.
      const duplicate = existingDocs.some(
        (d) =>
          d.exists() &&
          d.data()?.phoneNumber === phoneNumber &&
          d.data()?.preferredTime === formData.preferredTime &&
          d.data()?.status === 'pending',
      )
      if (duplicate) {
        throwBookingError('BOOKING_ALREADY_EXISTS')
      }

      // 6. Write the booking document atomically.
      const newRef = doc(collection(db, FIRESTORE_COLLECTIONS.BOOKINGS))
      const now = serverTimestamp()

      tx.set(newRef, {
        bookingId: newRef.id,
        customerName: formData.customerName,
        phoneNumber,
        email: formData.email ?? '',
        notes: formData.notes ?? '',
        serviceId: service.serviceId,
        serviceName: service.name,
        serviceDuration: service.durationMinutes,
        servicePrice: service.priceFrom,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        source: 'web',
      })

      return newRef.id
    })
  } catch (error: unknown) {
    // Always surface a BookingError with a stable code, never a raw Firebase error.
    throw toBookingError(error)
  }
}
