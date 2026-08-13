import type { NotificationChannel, NotificationEventType } from '../types/notification'

/**
 * Builds a stable idempotency key for a booking event + channel combination.
 *
 * Document IDs in `notificationDeliveries` use this key so concurrent function
 * invocations collide on the same Firestore document and only one write wins.
 */
export function buildIdempotencyKey(
  bookingId: string,
  eventType: NotificationEventType,
  channel: NotificationChannel,
): string {
  return `${bookingId}:${eventType}:${channel}`
}
