import { logger } from 'firebase-functions'
import { HttpsError } from 'firebase-functions/v2/https'
import type {
  BookingSnapshot,
  NotificationChannel,
  ResendNotificationResult,
} from '../types/notification'
import { validateBookingSnapshot } from '../utils/bookingValidation'
import { assertAdmin } from '../utils/adminAuth'
import {
  DeliveryProcessingError,
  prepareManualResend,
  finalizeDeliveryAttempt,
} from './deliveryRepository'
import { buildIdempotencyKey } from '../utils/idempotency'
import {
  buildConfirmationPayload,
  createDefaultRuntime,
  type NotificationRuntime,
} from './notificationOrchestrator'
import { createSettingsReader } from './settingsReader'
import { isEmailConfigValid } from '../config/emailConfig'
import { isWhatsAppConfigValid } from '../config/whatsappConfig'
import {
  hasEmailRecipient,
  hasValidPhoneRecipient,
  isPhoneMissing,
} from '../utils/bookingValidation'
import { buildConfirmationEmail } from '../templates/confirmationEmail'
import { sanitizeErrorForStorage } from '../utils/emailErrors'
import { sanitizeWhatsAppErrorForStorage } from '../utils/whatsappErrors'

const ALLOWED_CHANNELS: NotificationChannel[] = ['email', 'whatsapp']

export interface ResendNotificationInput {
  bookingId: string
  channel: NotificationChannel
}

/**
 * Secure manual resend for admin users. All booking content is rebuilt from
 * Firestore — client-provided recipient or status is never trusted.
 */
export async function resendNotification(
  db: FirebaseFirestore.Firestore,
  callerUid: string | undefined,
  input: ResendNotificationInput,
  runtime?: NotificationRuntime,
): Promise<ResendNotificationResult> {
  const adminUid = await assertAdmin(db, callerUid)

  const bookingId = input.bookingId?.trim()
  if (!bookingId) {
    throw new HttpsError('invalid-argument', 'bookingId is required.')
  }

  const channel = input.channel
  if (!ALLOWED_CHANNELS.includes(channel)) {
    throw new HttpsError('invalid-argument', 'channel must be email or whatsapp.')
  }

  logger.info('Manual notification resend requested', {
    adminUid,
    bookingId,
    channel,
  })

  const bookingSnap = await db.collection('bookings').doc(bookingId).get()
  if (!bookingSnap.exists) {
    throw new HttpsError('not-found', 'Booking not found.')
  }

  const validation = validateBookingSnapshot(bookingId, bookingSnap.data())
  if (!validation.valid || !validation.booking) {
    throw new HttpsError('failed-precondition', validation.error ?? 'Invalid booking.')
  }

  const booking = validation.booking

  if (booking.status !== 'confirmed') {
    throw new HttpsError(
      'failed-precondition',
      'Notifications can only be resent for confirmed bookings.',
    )
  }

  const settingsReader = createSettingsReader(db)
  const [businessInfo, notificationSettings] = await Promise.all([
    settingsReader.getBusinessInfo(),
    settingsReader.getNotificationSettings(),
  ])

  const payload = buildConfirmationPayload(booking, businessInfo)
  const resolvedRuntime =
    runtime ??
    createDefaultRuntime({
      brevoApiKey: process.env.BREVO_API_KEY ?? '',
      emailConfig: {
        fromEmail: process.env.NOTIFICATION_FROM_EMAIL ?? '',
        fromName: process.env.NOTIFICATION_FROM_NAME ?? 'Makeng Salon',
      },
      whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? '',
      whatsappConfig: {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
        templateName: process.env.WHATSAPP_CONFIRMATION_TEMPLATE ?? '',
        templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? 'en',
        apiVersion: process.env.WHATSAPP_API_VERSION ?? 'v21.0',
      },
    })

  if (channel === 'email') {
    return resendEmailChannel(
      db,
      booking,
      payload,
      notificationSettings.emailEnabled,
      resolvedRuntime,
      adminUid,
    )
  }

  return resendWhatsappChannel(
    db,
    booking,
    payload,
    notificationSettings.whatsappEnabled,
    resolvedRuntime,
    adminUid,
  )
}

async function resendEmailChannel(
  db: FirebaseFirestore.Firestore,
  booking: BookingSnapshot,
  payload: ReturnType<typeof buildConfirmationPayload>,
  emailEnabled: boolean,
  runtime: NotificationRuntime,
  adminUid: string,
): Promise<ResendNotificationResult> {
  const recipient = booking.email?.trim() ?? ''

  if (!hasEmailRecipient(booking.email)) {
    throw new HttpsError('failed-precondition', 'Booking has no email address.')
  }

  if (!emailEnabled) {
    return buildResendResult(booking.bookingId, 'email', buildDeliveryId(booking.bookingId, 'email'), '', {
      status: 'skipped',
      skipReason: 'disabled',
    })
  }

  if (!isEmailConfigValid(runtime.emailConfig)) {
    let attempt: { deliveryId: string; attemptId: string }
    try {
      attempt = await prepareManualResend(db, {
        bookingId: booking.bookingId,
        channel: 'email',
        recipient,
        provider: 'brevo',
        triggeredByUid: adminUid,
      })
    } catch (error) {
      if (error instanceof DeliveryProcessingError) {
        throw new HttpsError('failed-precondition', error.message)
      }
      throw error
    }

    await finalizeDeliveryAttempt(db, {
      bookingId: booking.bookingId,
      channel: 'email',
      attemptId: attempt.attemptId,
      status: 'failed',
      errorCode: 'sender_not_configured',
      errorMessage: 'Email sender is not configured.',
      trigger: 'manual_resend',
      triggeredByUid: adminUid,
    })

    return buildResendResult(booking.bookingId, 'email', attempt.deliveryId, attempt.attemptId, {
      status: 'failed',
      errorCode: 'sender_not_configured',
      errorMessage: 'Email sender is not configured.',
    })
  }

  let attempt: { deliveryId: string; attemptId: string }
  try {
    attempt = await prepareManualResend(db, {
      bookingId: booking.bookingId,
      channel: 'email',
      recipient,
      provider: 'brevo',
      triggeredByUid: adminUid,
    })
  } catch (error) {
    if (error instanceof DeliveryProcessingError) {
      throw new HttpsError('failed-precondition', error.message)
    }
    throw error
  }

  const emailContent = buildConfirmationEmail(payload)

  try {
    const result = await runtime.emailService.sendConfirmationEmail({
      toEmail: recipient,
      toName: booking.customerName,
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      textContent: emailContent.text,
    })

    await finalizeDeliveryAttempt(db, {
      bookingId: booking.bookingId,
      channel: 'email',
      attemptId: attempt.attemptId,
      status: 'sent',
      providerMessageId: result.providerMessageId,
      trigger: 'manual_resend',
      triggeredByUid: adminUid,
    })

    logger.info('Manual email resend succeeded', {
      adminUid,
      bookingId: booking.bookingId,
      channel: 'email',
      attemptId: attempt.attemptId,
      providerMessageId: result.providerMessageId,
    })

    return buildResendResult(booking.bookingId, 'email', attempt.deliveryId, attempt.attemptId, {
      status: 'sent',
      providerMessageId: result.providerMessageId,
    })
  } catch (error) {
    const { code, message } = sanitizeErrorForStorage(error)

    await finalizeDeliveryAttempt(db, {
      bookingId: booking.bookingId,
      channel: 'email',
      attemptId: attempt.attemptId,
      status: 'failed',
      errorCode: code,
      errorMessage: message,
      trigger: 'manual_resend',
      triggeredByUid: adminUid,
    })

    logger.info('Manual email resend failed', {
      adminUid,
      bookingId: booking.bookingId,
      channel: 'email',
      attemptId: attempt.attemptId,
      errorCode: code,
    })

    return buildResendResult(booking.bookingId, 'email', attempt.deliveryId, attempt.attemptId, {
      status: 'failed',
      errorCode: code,
      errorMessage: message,
    })
  }
}

async function resendWhatsappChannel(
  db: FirebaseFirestore.Firestore,
  booking: BookingSnapshot,
  payload: ReturnType<typeof buildConfirmationPayload>,
  whatsappEnabled: boolean,
  runtime: NotificationRuntime,
  adminUid: string,
): Promise<ResendNotificationResult> {
  const recipient = booking.phoneNumber?.trim() ?? ''

  if (isPhoneMissing(booking.phoneNumber)) {
    throw new HttpsError('failed-precondition', 'Booking has no phone number.')
  }

  if (!hasValidPhoneRecipient(booking.phoneNumber)) {
    throw new HttpsError('failed-precondition', 'Booking phone number is invalid.')
  }

  if (!whatsappEnabled) {
    return buildResendResult(booking.bookingId, 'whatsapp', buildDeliveryId(booking.bookingId, 'whatsapp'), '', {
      status: 'skipped',
      skipReason: 'disabled',
    })
  }

  if (!isWhatsAppConfigValid(runtime.whatsappConfig)) {
    let attempt: { deliveryId: string; attemptId: string }
    try {
      attempt = await prepareManualResend(db, {
        bookingId: booking.bookingId,
        channel: 'whatsapp',
        recipient,
        provider: 'meta-whatsapp',
        triggeredByUid: adminUid,
      })
    } catch (error) {
      if (error instanceof DeliveryProcessingError) {
        throw new HttpsError('failed-precondition', error.message)
      }
      throw error
    }

    await finalizeDeliveryAttempt(db, {
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      attemptId: attempt.attemptId,
      status: 'failed',
      errorCode: 'provider_not_configured',
      errorMessage: 'WhatsApp provider is not configured.',
      trigger: 'manual_resend',
      triggeredByUid: adminUid,
    })

    return buildResendResult(booking.bookingId, 'whatsapp', attempt.deliveryId, attempt.attemptId, {
      status: 'failed',
      errorCode: 'provider_not_configured',
      errorMessage: 'WhatsApp provider is not configured.',
    })
  }

  let attempt: { deliveryId: string; attemptId: string }
  try {
    attempt = await prepareManualResend(db, {
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      recipient,
      provider: 'meta-whatsapp',
      triggeredByUid: adminUid,
    })
  } catch (error) {
    if (error instanceof DeliveryProcessingError) {
      throw new HttpsError('failed-precondition', error.message)
    }
    throw error
  }

  try {
    const result = await runtime.whatsappService.sendConfirmationWhatsApp({
      payload,
      recipientE164: recipient,
    })

    await finalizeDeliveryAttempt(db, {
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      attemptId: attempt.attemptId,
      status: 'sent',
      providerMessageId: result.providerMessageId,
      trigger: 'manual_resend',
      triggeredByUid: adminUid,
    })

    logger.info('Manual WhatsApp resend succeeded', {
      adminUid,
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      attemptId: attempt.attemptId,
      providerMessageId: result.providerMessageId,
    })

    return buildResendResult(booking.bookingId, 'whatsapp', attempt.deliveryId, attempt.attemptId, {
      status: 'sent',
      providerMessageId: result.providerMessageId,
    })
  } catch (error) {
    const { code, message } = sanitizeWhatsAppErrorForStorage(error)

    await finalizeDeliveryAttempt(db, {
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      attemptId: attempt.attemptId,
      status: 'failed',
      errorCode: code,
      errorMessage: message,
      trigger: 'manual_resend',
      triggeredByUid: adminUid,
    })

    logger.info('Manual WhatsApp resend failed', {
      adminUid,
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      attemptId: attempt.attemptId,
      errorCode: code,
    })

    return buildResendResult(booking.bookingId, 'whatsapp', attempt.deliveryId, attempt.attemptId, {
      status: 'failed',
      errorCode: code,
      errorMessage: message,
    })
  }
}

function buildDeliveryId(bookingId: string, channel: NotificationChannel): string {
  return buildIdempotencyKey(bookingId, 'confirmation', channel)
}

function buildResendResult(
  bookingId: string,
  channel: NotificationChannel,
  deliveryId: string,
  attemptId: string,
  outcome: {
    status: ResendNotificationResult['status']
    skipReason?: ResendNotificationResult['skipReason']
    errorCode?: string
    errorMessage?: string
    providerMessageId?: string
  },
): ResendNotificationResult {
  return {
    bookingId,
    channel,
    deliveryId,
    attemptId,
    status: outcome.status,
    skipReason: outcome.skipReason,
    errorCode: outcome.errorCode,
    errorMessage: outcome.errorMessage,
    providerMessageId: outcome.providerMessageId,
  }
}
