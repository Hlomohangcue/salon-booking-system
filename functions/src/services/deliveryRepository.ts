import { FieldValue } from 'firebase-admin/firestore'
import type {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationProvider,
  NotificationSkipReason,
} from '../types/notification'
import { NOTIFICATION_DELIVERIES_COLLECTION } from '../types/notification'
import { buildIdempotencyKey } from '../utils/idempotency'

export interface DeliveryClaimResult {
  idempotencyKey: string
  /** True when a new delivery document was created in this call. */
  created: boolean
  /** True when an existing terminal delivery prevents re-processing. */
  alreadyFinalized: boolean
  status: NotificationDeliveryStatus
  skipReason?: NotificationSkipReason
}

interface ClaimDeliveryParams {
  bookingId: string
  channel: NotificationChannel
  recipient: string
  provider: NotificationProvider
  initialStatus: NotificationDeliveryStatus
  skipReason?: NotificationSkipReason
}

const TERMINAL_STATUSES: NotificationDeliveryStatus[] = ['sent', 'skipped', 'failed']

/**
 * Atomically creates a delivery document or returns an existing one.
 * Document ID equals the idempotency key.
 */
export async function claimDelivery(
  db: FirebaseFirestore.Firestore,
  params: ClaimDeliveryParams,
): Promise<DeliveryClaimResult> {
  const idempotencyKey = buildIdempotencyKey(params.bookingId, 'confirmation', params.channel)
  const ref = db.collection(NOTIFICATION_DELIVERIES_COLLECTION).doc(idempotencyKey)

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(ref)
    if (existing.exists) {
      const data = existing.data() as {
        status?: NotificationDeliveryStatus
        skipReason?: NotificationSkipReason
      }
      const status = data.status ?? 'pending'
      return {
        idempotencyKey,
        created: false,
        alreadyFinalized: TERMINAL_STATUSES.includes(status),
        status,
        skipReason: data.skipReason,
      }
    }

    tx.set(ref, {
      deliveryId: idempotencyKey,
      bookingId: params.bookingId,
      eventType: 'confirmation',
      channel: params.channel,
      trigger: 'status_transition',
      recipient: params.recipient,
      status: params.initialStatus,
      provider: params.provider,
      attempts: 0,
      idempotencyKey,
      ...(params.skipReason ? { skipReason: params.skipReason } : {}),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return {
      idempotencyKey,
      created: true,
      alreadyFinalized: params.initialStatus === 'skipped',
      status: params.initialStatus,
      skipReason: params.skipReason,
    }
  })
}

export interface UpdateDeliveryParams {
  bookingId: string
  channel: NotificationChannel
  status: NotificationDeliveryStatus
  attempts?: number
  providerMessageId?: string
  errorCode?: string
  errorMessage?: string
  skipReason?: NotificationSkipReason
}

/** Updates an existing delivery document by idempotency key. */
export async function updateDelivery(
  db: FirebaseFirestore.Firestore,
  params: UpdateDeliveryParams,
): Promise<void> {
  const idempotencyKey = buildIdempotencyKey(params.bookingId, 'confirmation', params.channel)
  const ref = db.collection(NOTIFICATION_DELIVERIES_COLLECTION).doc(idempotencyKey)

  const update: Record<string, unknown> = {
    status: params.status,
    updatedAt: FieldValue.serverTimestamp(),
    lastAttemptAt: FieldValue.serverTimestamp(),
  }

  if (params.attempts !== undefined) update.attempts = params.attempts
  if (params.providerMessageId) update.providerMessageId = params.providerMessageId
  if (params.errorCode) update.errorCode = params.errorCode
  if (params.errorMessage) update.errorMessage = params.errorMessage
  if (params.skipReason) update.skipReason = params.skipReason
  if (params.status === 'sent') update.sentAt = FieldValue.serverTimestamp()

  await ref.update(update)
}

/** @deprecated Use claimDelivery — kept for concurrent idempotency unit test. */
export async function createDeliveryIfAbsent(
  db: FirebaseFirestore.Firestore,
  params: {
    bookingId: string
    channel: NotificationChannel
    recipient: string
    status: NotificationDeliveryStatus
    skipReason?: NotificationSkipReason
    provider?: NotificationProvider
  },
): Promise<{ channel: NotificationChannel; idempotencyKey: string; created: boolean; status: NotificationDeliveryStatus; skipReason?: NotificationSkipReason }> {
  const result = await claimDelivery(db, {
    bookingId: params.bookingId,
    channel: params.channel,
    recipient: params.recipient,
    provider: params.provider ?? 'log-only',
    initialStatus: params.status,
    skipReason: params.skipReason,
  })

  return {
    channel: params.channel,
    idempotencyKey: result.idempotencyKey,
    created: result.created,
    status: result.status,
    skipReason: result.skipReason,
  }
}
