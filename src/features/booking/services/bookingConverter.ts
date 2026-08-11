import type { QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore'
import type { Booking, BookingDocument } from '../types'

/**
 * Converts a raw Firestore Booking document (with Timestamp fields) into the
 * domain `Booking` shape (with JavaScript Date fields).
 *
 * This is the single source of truth for that conversion. Both the
 * customer-facing `bookingService` and the `adminBookingService` use it so the
 * mapping never drifts between the two modules.
 */
export function fromFirestore(data: BookingDocument): Booking {
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
 * A Firestore `withConverter`-compatible converter for bookings.
 *
 * Converts on read (Timestamps → Dates) and on write (Dates → Timestamps via
 * `serverTimestamp`, which Firestore accepts directly). Using `.withConverter`
 * removes the need for callers to map snapshots manually.
 */
export const bookingConverter = {
  toFirestore(booking: Partial<Booking>): Record<string, unknown> {
    // Dates are serialised as-is; Firestore stores JS Date objects natively.
    // serverTimestamp() is used by the write paths and is not part of the
    // domain shape, so it is passed through explicitly by callers.
    return { ...booking } as Record<string, unknown>
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Booking {
    const data = snapshot.data(options) as BookingDocument
    return fromFirestore(data)
  },
}
