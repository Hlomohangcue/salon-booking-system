/**
 * Notification delivery types for Cloud Functions.
 *
 * Mirrors the Phase 4 architecture design. The frontend booking types are
 * intentionally not imported here to keep the functions package self-contained.
 */

import type { Timestamp } from 'firebase-admin/firestore'

/** Firestore collection for notification delivery audit records. */
export const NOTIFICATION_DELIVERIES_COLLECTION = 'notificationDeliveries'

/** Subcollection under each delivery document for per-attempt audit history. */
export const NOTIFICATION_ATTEMPTS_SUBCOLLECTION = 'attempts'

export type NotificationEventType = 'confirmation'

export type NotificationChannel = 'email' | 'whatsapp'

export type NotificationTrigger = 'status_transition' | 'manual_resend'

/**
 * Delivery lifecycle status.
 *
 * Email (Phase 4.3): pending → processing → sent | failed | skipped
 * WhatsApp (Phase 4.4): pending → processing → sent | failed | skipped
 */
export type NotificationDeliveryStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'skipped'

export type NotificationSkipReason =
  | 'missing_recipient'
  | 'invalid_recipient'
  | 'disabled'
  | 'malformed_booking'

/** Provider used for a delivery record. */
export type NotificationProvider = 'log-only' | 'brevo' | 'meta-whatsapp'

export interface NotificationDeliveryDocument {
  deliveryId: string
  bookingId: string
  eventType: NotificationEventType
  channel: NotificationChannel
  trigger: NotificationTrigger
  recipient: string
  status: NotificationDeliveryStatus
  skipReason?: NotificationSkipReason
  provider: NotificationProvider
  providerMessageId?: string
  attempts: number
  lastAttemptAt?: Timestamp
  sentAt?: Timestamp
  errorCode?: string
  errorMessage?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  idempotencyKey: string
  triggeredByUid?: string
}

/**
 * A single send attempt under notificationDeliveries/{deliveryId}/attempts/{attemptId}.
 * Original confirmation and manual resends each create a new attempt; the parent
 * delivery document holds the latest aggregate state.
 */
export interface NotificationAttemptDocument {
  attemptId: string
  channel: NotificationChannel
  provider: NotificationProvider
  status: NotificationDeliveryStatus
  trigger: NotificationTrigger
  startedAt: Timestamp
  completedAt?: Timestamp
  providerMessageId?: string
  errorCode?: string
  errorMessage?: string
  skipReason?: NotificationSkipReason
  triggeredByUid?: string
}

/** Sanitized result returned to admin clients after a manual resend. */
export interface ResendNotificationResult {
  bookingId: string
  channel: NotificationChannel
  deliveryId: string
  attemptId: string
  status: NotificationDeliveryStatus
  skipReason?: NotificationSkipReason
  errorCode?: string
  errorMessage?: string
  providerMessageId?: string
}

/** Raw booking fields read from Firestore inside the trigger. */
export interface BookingSnapshot {
  bookingId: string
  customerName: string
  phoneNumber: string
  email?: string
  serviceId: string
  serviceName: string
  serviceDuration: number
  servicePrice: number
  preferredDate: string
  preferredTime: string
  status: string
  source?: string
}

/** Notification toggles from settings/notifications. */
export interface NotificationSettingsSnapshot {
  emailEnabled: boolean
  /** When false or absent in Firestore, WhatsApp confirmations are skipped. */
  whatsappEnabled: boolean
}

/** Business identity from settings/businessInfo (optional). */
export interface BusinessInfoSnapshot {
  salonName: string
  phone: string
  email: string
  address: string
  timezone: string
}

/** Internal payload logged and stored for future provider dispatch. */
export interface ConfirmationNotificationPayload {
  bookingId: string
  customerName: string
  phoneNumber: string
  email?: string
  serviceName: string
  serviceDuration: number
  servicePrice: number
  preferredDate: string
  preferredTime: string
  businessInfo?: BusinessInfoSnapshot
}

export interface DispatchChannelResult {
  channel: NotificationChannel
  idempotencyKey: string
  created: boolean
  status: NotificationDeliveryStatus
  skipReason?: NotificationSkipReason
}

export interface DispatchConfirmationResult {
  bookingId: string
  transitionDetected: boolean
  channels: DispatchChannelResult[]
  payload?: ConfirmationNotificationPayload
  error?: string
}
