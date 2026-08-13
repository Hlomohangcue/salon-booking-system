/** Notification delivery status mirrored from Cloud Functions (read-only). */
export type NotificationDeliveryStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'skipped'

export type NotificationChannel = 'email' | 'whatsapp'

export type NotificationSkipReason =
  | 'missing_recipient'
  | 'invalid_recipient'
  | 'disabled'
  | 'malformed_booking'

export type NotificationProvider = 'log-only' | 'brevo' | 'meta-whatsapp'

/** Sanitized delivery record exposed to admin UI. */
export interface NotificationDelivery {
  deliveryId: string
  bookingId: string
  channel: NotificationChannel
  status: NotificationDeliveryStatus
  provider: NotificationProvider
  recipient?: string
  skipReason?: NotificationSkipReason
  errorCode?: string
  errorMessage?: string
  sentAt?: Date
  updatedAt?: Date
}

export interface BookingNotificationState {
  email: NotificationDelivery | null
  whatsapp: NotificationDelivery | null
  loading: boolean
  error: string | null
}

export interface ResendNotificationResponse {
  bookingId: string
  channel: NotificationChannel
  deliveryId: string
  attemptId: string
  status: NotificationDeliveryStatus
  skipReason?: NotificationSkipReason
  errorCode?: string
  errorMessage?: string
}
