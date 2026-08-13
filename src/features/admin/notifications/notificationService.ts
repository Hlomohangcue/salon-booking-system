import {
  doc,
  getDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db, app } from '../../../lib/firebase'
import type {
  BookingNotificationState,
  NotificationChannel,
  NotificationDelivery,
  NotificationDeliveryStatus,
  NotificationProvider,
  NotificationSkipReason,
  ResendNotificationResponse,
} from './types'

const NOTIFICATION_DELIVERIES = 'notificationDeliveries'

function buildDeliveryId(bookingId: string, channel: NotificationChannel): string {
  return `${bookingId}:confirmation:${channel}`
}

function toDate(value: unknown): Date | undefined {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return undefined
}

function normalizeDelivery(
  channel: NotificationChannel,
  data: Record<string, unknown> | undefined,
): NotificationDelivery | null {
  if (!data) return null

  return {
    deliveryId: String(data.deliveryId ?? ''),
    bookingId: String(data.bookingId ?? ''),
    channel,
    status: (data.status as NotificationDeliveryStatus) ?? 'pending',
    provider: (data.provider as NotificationProvider) ?? 'log-only',
    recipient: typeof data.recipient === 'string' && data.recipient ? data.recipient : undefined,
    skipReason: data.skipReason as NotificationSkipReason | undefined,
    errorCode: typeof data.errorCode === 'string' ? data.errorCode : undefined,
    errorMessage: typeof data.errorMessage === 'string' ? data.errorMessage : undefined,
    sentAt: toDate(data.sentAt),
    updatedAt: toDate(data.updatedAt),
  }
}

/** Fetch both channel delivery records for a booking (admin read-only). */
export async function getNotificationDeliveries(
  bookingId: string,
): Promise<Pick<BookingNotificationState, 'email' | 'whatsapp'>> {
  const [emailSnap, whatsappSnap] = await Promise.all([
    getDoc(doc(db, NOTIFICATION_DELIVERIES, buildDeliveryId(bookingId, 'email'))),
    getDoc(doc(db, NOTIFICATION_DELIVERIES, buildDeliveryId(bookingId, 'whatsapp'))),
  ])

  return {
    email: emailSnap.exists() ? normalizeDelivery('email', emailSnap.data()) : null,
    whatsapp: whatsappSnap.exists()
      ? normalizeDelivery('whatsapp', whatsappSnap.data())
      : null,
  }
}

/** Subscribe to live updates for both delivery documents. */
export function subscribeToNotificationDeliveries(
  bookingId: string,
  onChange: (state: Pick<BookingNotificationState, 'email' | 'whatsapp'>) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  let email: NotificationDelivery | null = null
  let whatsapp: NotificationDelivery | null = null

  const emit = () => onChange({ email, whatsapp })

  const emailUnsub = onSnapshot(
    doc(db, NOTIFICATION_DELIVERIES, buildDeliveryId(bookingId, 'email')),
    (snap) => {
      email = snap.exists() ? normalizeDelivery('email', snap.data()) : null
      emit()
    },
    () => onError?.('Unable to load email notification status.'),
  )

  const whatsappUnsub = onSnapshot(
    doc(db, NOTIFICATION_DELIVERIES, buildDeliveryId(bookingId, 'whatsapp')),
    (snap) => {
      whatsapp = snap.exists() ? normalizeDelivery('whatsapp', snap.data()) : null
      emit()
    },
    () => onError?.('Unable to load WhatsApp notification status.'),
  )

  return () => {
    emailUnsub()
    whatsappUnsub()
  }
}

/** Invoke the secure admin resend callable. */
export async function resendNotification(
  bookingId: string,
  channel: NotificationChannel,
): Promise<ResendNotificationResponse> {
  const functions = getFunctions(app, 'africa-south1')
  const callable = httpsCallable<
    { bookingId: string; channel: NotificationChannel },
    ResendNotificationResponse
  >(functions, 'resendNotificationCallable')

  const result = await callable({ bookingId, channel })
  return result.data
}
