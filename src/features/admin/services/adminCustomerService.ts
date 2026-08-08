import { db } from '../../../lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  FIRESTORE_COLLECTIONS,
  type Booking,
  type BookingDocument,
  type Customer,
  type CustomerDocument,
} from '../../booking/types'
import { BookingError, toBookingError } from '../../booking/errors/bookingErrors'

/**
 * Customer management service.
 *
 * Customer metadata lives in the `customers` collection (keyed by E.164 phone
 * number). Booking activity (total bookings, last visit, upcoming) is always
 * derived from the `bookings` collection — it is never duplicated on the
 * customer document.
 *
 * All mutations are explicit methods (no generic CRUD helpers) and rely on the
 * Firestore security rules that gate `customers` writes behind `isAdmin()`.
 */

// Converts raw Firestore Timestamps to JavaScript Date objects.
function fromFirestore(data: CustomerDocument): Customer {
  return {
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as Customer
}

function bookingFromFirestore(data: BookingDocument): Booking {
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
 * Fetch all customer metadata documents, sorted by customer name ascending.
 * The `customers` collection is the source of identity + archived state.
 */
export async function getCustomers(): Promise<Customer[]> {
  const snap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.CUSTOMERS))
  const customers = snap.docs.map((d) =>
    fromFirestore(d.data() as CustomerDocument),
  )
  return customers.sort((a, b) =>
    a.customerName.localeCompare(b.customerName, undefined, { sensitivity: 'base' }),
  )
}

/**
 * Fetch a single customer by its Firestore document ID (the E.164 phone).
 * Returns null if no customer exists with that ID.
 */
export async function getCustomer(customerId: string): Promise<Customer | null> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.CUSTOMERS, customerId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return fromFirestore(snap.data() as CustomerDocument)
}

/**
 * Fetch all bookings for a customer (matched by E.164 phone number), ordered
 * by preferred date descending. No customer document read is required — the
 * phone number is the natural key shared by both collections.
 */
export async function getCustomerBookings(customerId: string): Promise<Booking[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.BOOKINGS),
    where('phoneNumber', '==', customerId),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => bookingFromFirestore(d.data() as BookingDocument))
    .sort((a, b) => b.preferredDate.localeCompare(a.preferredDate))
}

/**
 * Archive a customer (archived = true) so they are hidden from the active
 * list. Booking history is preserved — only the metadata flag changes.
 */
export async function archiveCustomer(customerId: string): Promise<void> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.CUSTOMERS, customerId)
  await updateDoc(ref, {
    archived: true,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Restore a previously archived customer (archived = false).
 */
export async function restoreCustomer(customerId: string): Promise<void> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.CUSTOMERS, customerId)
  await updateDoc(ref, {
    archived: false,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Wraps a mutation so callers always get a BookingError with a stable code
 * rather than a raw Firebase error. Reuses the booking error mapping since the
 * customer module shares the same Firestore error surface.
 */
export function adminCustomerError(error: unknown): BookingError {
  return toBookingError(error)
}
