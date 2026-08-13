import { FieldValue } from 'firebase-admin/firestore'
import type {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationProvider,
  NotificationSkipReason,
  NotificationTrigger,
} from '../types/notification'
import {
  NOTIFICATION_ATTEMPTS_SUBCOLLECTION,
  NOTIFICATION_DELIVERIES_COLLECTION,
} from '../types/notification'
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
  trigger?: NotificationTrigger
}

const TERMINAL_STATUSES: NotificationDeliveryStatus[] = ['sent', 'skipped', 'failed']

function deliveryRef(db: FirebaseFirestore.Firestore, idempotencyKey: string) {
  return db.collection(NOTIFICATION_DELIVERIES_COLLECTION).doc(idempotencyKey)
}

function attemptsCollection(
  db: FirebaseFirestore.Firestore,
  idempotencyKey: string,
) {
  return deliveryRef(db, idempotencyKey).collection(NOTIFICATION_ATTEMPTS_SUBCOLLECTION)
}

export interface StartAttemptParams {
  bookingId: string
  channel: NotificationChannel
  provider: NotificationProvider
  recipient: string
  trigger: NotificationTrigger
  triggeredByUid?: string
}

export interface StartAttemptResult {
  deliveryId: string
  attemptId: string
  attemptNumber: number
}

export interface FinalizeAttemptParams {
  bookingId: string
  channel: NotificationChannel
  attemptId: string
  status: NotificationDeliveryStatus
  providerMessageId?: string
  errorCode?: string
  errorMessage?: string
  skipReason?: NotificationSkipReason
  trigger?: NotificationTrigger
  triggeredByUid?: string
}

export interface ManualResendPrepareResult {
  deliveryId: string
  attemptId: string
  attemptNumber: number
}

export class DeliveryProcessingError extends Error {
  constructor(
    readonly code: 'already_processing',
    message: string,
  ) {
    super(message)
    this.name = 'DeliveryProcessingError'
  }
}

/**
 * Atomically creates a delivery document or returns an existing one.
 * Document ID equals the idempotency key.
 */
export async function claimDelivery(
  db: FirebaseFirestore.Firestore,
  params: ClaimDeliveryParams,
): Promise<DeliveryClaimResult> {
  const idempotencyKey = buildIdempotencyKey(params.bookingId, 'confirmation', params.channel)
  const ref = deliveryRef(db, idempotencyKey)

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
      trigger: params.trigger ?? 'status_transition',
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

/**
 * Creates an attempt record and marks the parent delivery as processing.
 * Used for both initial confirmation sends and manual admin resends.
 */
export async function startDeliveryAttempt(
  db: FirebaseFirestore.Firestore,
  params: StartAttemptParams,
): Promise<StartAttemptResult> {
  const deliveryId = buildIdempotencyKey(params.bookingId, 'confirmation', params.channel)
  const parentRef = deliveryRef(db, deliveryId)
  const attemptRef = attemptsCollection(db, deliveryId).doc()

  return db.runTransaction(async (tx) => {
    const parentSnap = await tx.get(parentRef)
    const currentAttempts = parentSnap.exists
      ? ((parentSnap.data()?.attempts as number | undefined) ?? 0)
      : 0
    const attemptNumber = currentAttempts + 1

    tx.set(attemptRef, {
      attemptId: attemptRef.id,
      channel: params.channel,
      provider: params.provider,
      status: 'processing',
      trigger: params.trigger,
      startedAt: FieldValue.serverTimestamp(),
      ...(params.triggeredByUid ? { triggeredByUid: params.triggeredByUid } : {}),
    })

    if (parentSnap.exists) {
      tx.update(parentRef, {
        status: 'processing',
        trigger: params.trigger,
        recipient: params.recipient,
        provider: params.provider,
        attempts: attemptNumber,
        updatedAt: FieldValue.serverTimestamp(),
        lastAttemptAt: FieldValue.serverTimestamp(),
        ...(params.triggeredByUid ? { triggeredByUid: params.triggeredByUid } : {}),
        errorCode: FieldValue.delete(),
        errorMessage: FieldValue.delete(),
        skipReason: FieldValue.delete(),
      })
    } else {
      tx.set(parentRef, {
        deliveryId,
        bookingId: params.bookingId,
        eventType: 'confirmation',
        channel: params.channel,
        trigger: params.trigger,
        recipient: params.recipient,
        status: 'processing',
        provider: params.provider,
        attempts: attemptNumber,
        idempotencyKey: deliveryId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastAttemptAt: FieldValue.serverTimestamp(),
        ...(params.triggeredByUid ? { triggeredByUid: params.triggeredByUid } : {}),
      })
    }

    return {
      deliveryId,
      attemptId: attemptRef.id,
      attemptNumber,
    }
  })
}

/**
 * Finalizes an attempt and updates the parent delivery with the latest state.
 */
export async function finalizeDeliveryAttempt(
  db: FirebaseFirestore.Firestore,
  params: FinalizeAttemptParams,
): Promise<void> {
  const deliveryId = buildIdempotencyKey(params.bookingId, 'confirmation', params.channel)
  const parentRef = deliveryRef(db, deliveryId)
  const attemptRef = attemptsCollection(db, deliveryId).doc(params.attemptId)

  const parentUpdate: Record<string, unknown> = {
    status: params.status,
    updatedAt: FieldValue.serverTimestamp(),
    lastAttemptAt: FieldValue.serverTimestamp(),
  }

  if (params.trigger) parentUpdate.trigger = params.trigger
  if (params.triggeredByUid) parentUpdate.triggeredByUid = params.triggeredByUid
  if (params.providerMessageId) parentUpdate.providerMessageId = params.providerMessageId
  if (params.errorCode) parentUpdate.errorCode = params.errorCode
  if (params.errorMessage) parentUpdate.errorMessage = params.errorMessage
  if (params.skipReason) parentUpdate.skipReason = params.skipReason
  if (params.status === 'sent') parentUpdate.sentAt = FieldValue.serverTimestamp()

  const attemptUpdate: Record<string, unknown> = {
    status: params.status,
    completedAt: FieldValue.serverTimestamp(),
  }
  if (params.providerMessageId) attemptUpdate.providerMessageId = params.providerMessageId
  if (params.errorCode) attemptUpdate.errorCode = params.errorCode
  if (params.errorMessage) attemptUpdate.errorMessage = params.errorMessage
  if (params.skipReason) attemptUpdate.skipReason = params.skipReason

  await attemptRef.update(attemptUpdate)
  await parentRef.update(parentUpdate)
}

/**
 * Records a skipped delivery with a single completed attempt (no provider call).
 */
export async function recordSkippedDelivery(
  db: FirebaseFirestore.Firestore,
  params: {
    bookingId: string
    channel: NotificationChannel
    recipient: string
    provider: NotificationProvider
    skipReason: NotificationSkipReason
    trigger?: NotificationTrigger
    triggeredByUid?: string
  },
): Promise<{ deliveryId: string; attemptId: string; created: boolean }> {
  const claim = await claimDelivery(db, {
    bookingId: params.bookingId,
    channel: params.channel,
    recipient: params.recipient,
    provider: params.provider,
    initialStatus: 'skipped',
    skipReason: params.skipReason,
    trigger: params.trigger,
  })

  if (!claim.created && claim.alreadyFinalized) {
    return { deliveryId: claim.idempotencyKey, attemptId: '', created: false }
  }

  const attemptRef = attemptsCollection(db, claim.idempotencyKey).doc()
  await attemptRef.set({
    attemptId: attemptRef.id,
    channel: params.channel,
    provider: params.provider,
    status: 'skipped',
    trigger: params.trigger ?? 'status_transition',
    skipReason: params.skipReason,
    startedAt: FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
    ...(params.triggeredByUid ? { triggeredByUid: params.triggeredByUid } : {}),
  })

  await deliveryRef(db, claim.idempotencyKey).update({
    status: 'skipped',
    skipReason: params.skipReason,
    attempts: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
    lastAttemptAt: FieldValue.serverTimestamp(),
    ...(params.triggeredByUid ? { triggeredByUid: params.triggeredByUid } : {}),
  })

  return { deliveryId: claim.idempotencyKey, attemptId: attemptRef.id, created: claim.created }
}

/**
 * Prepares a manual admin resend: rejects when already processing, otherwise
 * creates a new attempt and marks the parent as processing.
 */
export async function prepareManualResend(
  db: FirebaseFirestore.Firestore,
  params: {
    bookingId: string
    channel: NotificationChannel
    recipient: string
    provider: NotificationProvider
    triggeredByUid: string
  },
): Promise<ManualResendPrepareResult> {
  const deliveryId = buildIdempotencyKey(params.bookingId, 'confirmation', params.channel)
  const parentRef = deliveryRef(db, deliveryId)

  const parentSnap = await parentRef.get()
  if (parentSnap.exists && parentSnap.data()?.status === 'processing') {
    throw new DeliveryProcessingError(
      'already_processing',
      'Notification is currently processing.',
    )
  }

  const started = await startDeliveryAttempt(db, {
    bookingId: params.bookingId,
    channel: params.channel,
    provider: params.provider,
    recipient: params.recipient,
    trigger: 'manual_resend',
    triggeredByUid: params.triggeredByUid,
  })

  return started
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
  const ref = deliveryRef(db, idempotencyKey)

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
