import { logger } from 'firebase-functions'
import type {
  BookingSnapshot,
  ConfirmationNotificationPayload,
  DispatchChannelResult,
  DispatchConfirmationResult,
  NotificationSettingsSnapshot,
} from '../types/notification'
import { buildConfirmationEmail } from '../templates/confirmationEmail'
import type { EmailConfig } from '../config/emailConfig'
import { isEmailConfigValid } from '../config/emailConfig'
import type { WhatsAppConfig } from '../config/whatsappConfig'
import { isWhatsAppConfigValid } from '../config/whatsappConfig'
import { claimDelivery, updateDelivery } from './deliveryRepository'
import type { EmailService } from './emailService'
import { createBrevoEmailService } from './emailService'
import type { WhatsAppService } from './whatsappService'
import { createMetaWhatsAppService } from './whatsappService'
import { createSettingsReader, type SettingsReader } from './settingsReader'
import { isConfirmationTransition } from '../utils/transition'
import {
  hasEmailRecipient,
  hasValidPhoneRecipient,
  isPhoneMissing,
  validateBookingSnapshot,
} from '../utils/bookingValidation'
import { sanitizeErrorForStorage } from '../utils/emailErrors'
import { sanitizeWhatsAppErrorForStorage } from '../utils/whatsappErrors'

export interface BookingUpdateContext {
  bookingId: string
  before: FirebaseFirestore.DocumentData | undefined
  after: FirebaseFirestore.DocumentData | undefined
}

export interface NotificationRuntime {
  emailService: EmailService
  emailConfig: EmailConfig
  whatsappService: WhatsAppService
  whatsappConfig: WhatsAppConfig
}

export function buildConfirmationPayload(
  booking: BookingSnapshot,
  businessInfo?: ConfirmationNotificationPayload['businessInfo'],
): ConfirmationNotificationPayload {
  return {
    bookingId: booking.bookingId,
    customerName: booking.customerName,
    phoneNumber: booking.phoneNumber,
    email: booking.email,
    serviceName: booking.serviceName,
    serviceDuration: booking.serviceDuration,
    servicePrice: booking.servicePrice,
    preferredDate: booking.preferredDate,
    preferredTime: booking.preferredTime,
    ...(businessInfo ? { businessInfo } : {}),
  }
}

/**
 * Sends a real confirmation email via Brevo with full delivery lifecycle tracking.
 */
export async function dispatchEmailChannel(
  db: FirebaseFirestore.Firestore,
  booking: BookingSnapshot,
  payload: ConfirmationNotificationPayload,
  notificationSettings: NotificationSettingsSnapshot,
  runtime: NotificationRuntime,
): Promise<DispatchChannelResult> {
  const recipient = booking.email?.trim() ?? ''

  if (!hasEmailRecipient(booking.email)) {
    const claim = await claimDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'email',
      recipient: '',
      provider: 'brevo',
      initialStatus: 'skipped',
      skipReason: 'missing_recipient',
    })

    logEmailOutcome(booking.bookingId, {
      status: 'skipped',
      skipReason: 'missing_recipient',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
    })

    return {
      channel: 'email',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      status: 'skipped',
      skipReason: 'missing_recipient',
    }
  }

  if (!notificationSettings.emailEnabled) {
    const claim = await claimDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'email',
      recipient,
      provider: 'brevo',
      initialStatus: 'skipped',
      skipReason: 'disabled',
    })

    logEmailOutcome(booking.bookingId, {
      status: 'skipped',
      skipReason: 'disabled',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
    })

    return {
      channel: 'email',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      status: 'skipped',
      skipReason: 'disabled',
    }
  }

  if (!isEmailConfigValid(runtime.emailConfig)) {
    const claim = await claimDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'email',
      recipient,
      provider: 'brevo',
      initialStatus: 'pending',
    })

    if (!claim.created && claim.alreadyFinalized) {
      return finalizedEmailResult(claim)
    }

    await updateDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'email',
      status: 'failed',
      attempts: 1,
      errorCode: 'sender_not_configured',
      errorMessage: 'NOTIFICATION_FROM_EMAIL is not configured.',
    })

    logEmailOutcome(booking.bookingId, {
      status: 'failed',
      errorCode: 'sender_not_configured',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
    })

    return {
      channel: 'email',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      status: 'failed',
    }
  }

  const claim = await claimDelivery(db, {
    bookingId: booking.bookingId,
    channel: 'email',
    recipient,
    provider: 'brevo',
    initialStatus: 'pending',
  })

  if (!claim.created && claim.alreadyFinalized) {
    logEmailOutcome(booking.bookingId, {
      status: claim.status,
      idempotencyKey: claim.idempotencyKey,
      created: false,
      duplicatePrevented: true,
    })
    return finalizedEmailResult(claim)
  }

  const attemptNumber = claim.created ? 1 : 2

  await updateDelivery(db, {
    bookingId: booking.bookingId,
    channel: 'email',
    status: 'processing',
    attempts: attemptNumber,
  })

  const emailContent = buildConfirmationEmail(payload)

  try {
    const result = await runtime.emailService.sendConfirmationEmail({
      toEmail: recipient,
      toName: booking.customerName,
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      textContent: emailContent.text,
    })

    await updateDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'email',
      status: 'sent',
      attempts: attemptNumber,
      providerMessageId: result.providerMessageId,
    })

    logEmailOutcome(booking.bookingId, {
      status: 'sent',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      providerMessageId: result.providerMessageId,
      attempts: attemptNumber,
    })

    return {
      channel: 'email',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      status: 'sent',
    }
  } catch (error) {
    const { code, message } = sanitizeErrorForStorage(error)

    await updateDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'email',
      status: 'failed',
      attempts: attemptNumber,
      errorCode: code,
      errorMessage: message,
    })

    logEmailOutcome(booking.bookingId, {
      status: 'failed',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      errorCode: code,
      attempts: attemptNumber,
    })

    return {
      channel: 'email',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      status: 'failed',
    }
  }
}

function finalizedEmailResult(claim: {
  idempotencyKey: string
  status: DispatchChannelResult['status']
  skipReason?: DispatchChannelResult['skipReason']
}): DispatchChannelResult {
  return {
    channel: 'email',
    idempotencyKey: claim.idempotencyKey,
    created: false,
    status: claim.status,
    skipReason: claim.skipReason,
  }
}

function logEmailOutcome(
  bookingId: string,
  details: {
    status: string
    idempotencyKey: string
    created?: boolean
    skipReason?: string
    providerMessageId?: string
    errorCode?: string
    attempts?: number
    duplicatePrevented?: boolean
  },
): void {
  logger.info('Confirmation email delivery', {
    bookingId,
    eventType: 'confirmation',
    channel: 'email',
    provider: 'brevo',
    ...details,
  })
}

/**
 * Sends a real confirmation WhatsApp message via Meta Cloud API.
 */
export async function dispatchWhatsappChannel(
  db: FirebaseFirestore.Firestore,
  booking: BookingSnapshot,
  payload: ConfirmationNotificationPayload,
  notificationSettings: NotificationSettingsSnapshot,
  runtime: NotificationRuntime,
): Promise<DispatchChannelResult> {
  const recipient = booking.phoneNumber?.trim() ?? ''

  if (isPhoneMissing(booking.phoneNumber)) {
    const claim = await claimDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      recipient: '',
      provider: 'meta-whatsapp',
      initialStatus: 'skipped',
      skipReason: 'missing_recipient',
    })

    logWhatsappOutcome(booking.bookingId, {
      status: 'skipped',
      skipReason: 'missing_recipient',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
    })

    return {
      channel: 'whatsapp',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      status: 'skipped',
      skipReason: 'missing_recipient',
    }
  }

  if (!hasValidPhoneRecipient(booking.phoneNumber)) {
    const claim = await claimDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      recipient,
      provider: 'meta-whatsapp',
      initialStatus: 'skipped',
      skipReason: 'invalid_recipient',
    })

    logWhatsappOutcome(booking.bookingId, {
      status: 'skipped',
      skipReason: 'invalid_recipient',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
    })

    return {
      channel: 'whatsapp',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      status: 'skipped',
      skipReason: 'invalid_recipient',
    }
  }

  if (!notificationSettings.whatsappEnabled) {
    const claim = await claimDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      recipient,
      provider: 'meta-whatsapp',
      initialStatus: 'skipped',
      skipReason: 'disabled',
    })

    logWhatsappOutcome(booking.bookingId, {
      status: 'skipped',
      skipReason: 'disabled',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
    })

    return {
      channel: 'whatsapp',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      status: 'skipped',
      skipReason: 'disabled',
    }
  }

  if (!isWhatsAppConfigValid(runtime.whatsappConfig)) {
    const claim = await claimDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      recipient,
      provider: 'meta-whatsapp',
      initialStatus: 'pending',
    })

    if (!claim.created && claim.alreadyFinalized) {
      return finalizedWhatsappResult(claim)
    }

    await updateDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      status: 'failed',
      attempts: 1,
      errorCode: 'provider_not_configured',
      errorMessage:
        'WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_CONFIRMATION_TEMPLATE is not configured.',
    })

    logWhatsappOutcome(booking.bookingId, {
      status: 'failed',
      errorCode: 'provider_not_configured',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
    })

    return {
      channel: 'whatsapp',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      status: 'failed',
    }
  }

  const claim = await claimDelivery(db, {
    bookingId: booking.bookingId,
    channel: 'whatsapp',
    recipient,
    provider: 'meta-whatsapp',
    initialStatus: 'pending',
  })

  if (!claim.created && claim.alreadyFinalized) {
    logWhatsappOutcome(booking.bookingId, {
      status: claim.status,
      idempotencyKey: claim.idempotencyKey,
      created: false,
      duplicatePrevented: true,
    })
    return finalizedWhatsappResult(claim)
  }

  const attemptNumber = claim.created ? 1 : 2

  await updateDelivery(db, {
    bookingId: booking.bookingId,
    channel: 'whatsapp',
    status: 'processing',
    attempts: attemptNumber,
  })

  try {
    const result = await runtime.whatsappService.sendConfirmationWhatsApp({
      payload,
      recipientE164: recipient,
    })

    await updateDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      status: 'sent',
      attempts: attemptNumber,
      providerMessageId: result.providerMessageId,
    })

    logWhatsappOutcome(booking.bookingId, {
      status: 'sent',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      providerMessageId: result.providerMessageId,
      attempts: attemptNumber,
    })

    return {
      channel: 'whatsapp',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      status: 'sent',
    }
  } catch (error) {
    const { code, message } = sanitizeWhatsAppErrorForStorage(error)

    await updateDelivery(db, {
      bookingId: booking.bookingId,
      channel: 'whatsapp',
      status: 'failed',
      attempts: attemptNumber,
      errorCode: code,
      errorMessage: message,
    })

    logWhatsappOutcome(booking.bookingId, {
      status: 'failed',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      errorCode: code,
      attempts: attemptNumber,
    })

    return {
      channel: 'whatsapp',
      idempotencyKey: claim.idempotencyKey,
      created: claim.created,
      status: 'failed',
    }
  }
}

function finalizedWhatsappResult(claim: {
  idempotencyKey: string
  status: DispatchChannelResult['status']
  skipReason?: DispatchChannelResult['skipReason']
}): DispatchChannelResult {
  return {
    channel: 'whatsapp',
    idempotencyKey: claim.idempotencyKey,
    created: false,
    status: claim.status,
    skipReason: claim.skipReason,
  }
}

function logWhatsappOutcome(
  bookingId: string,
  details: {
    status: string
    idempotencyKey: string
    created?: boolean
    skipReason?: string
    providerMessageId?: string
    errorCode?: string
    attempts?: number
    duplicatePrevented?: boolean
  },
): void {
  logger.info('Confirmation WhatsApp delivery', {
    bookingId,
    eventType: 'confirmation',
    channel: 'whatsapp',
    provider: 'meta-whatsapp',
    ...details,
  })
}

export async function dispatchConfirmationNotifications(
  db: FirebaseFirestore.Firestore,
  booking: BookingSnapshot,
  settingsReader: SettingsReader = createSettingsReader(db),
  runtime?: NotificationRuntime,
): Promise<DispatchConfirmationResult> {
  const [businessInfo, notificationSettings] = await Promise.all([
    settingsReader.getBusinessInfo(),
    settingsReader.getNotificationSettings(),
  ])

  const payload = buildConfirmationPayload(booking, businessInfo)

  const emailRuntime =
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

  const emailResult = await dispatchEmailChannel(
    db,
    booking,
    payload,
    notificationSettings,
    emailRuntime,
  )

  const whatsappResult = await dispatchWhatsappChannel(
    db,
    booking,
    payload,
    notificationSettings,
    emailRuntime,
  )
  const channels = [emailResult, whatsappResult]

  logger.info('Confirmation notification pipeline completed', {
    bookingId: booking.bookingId,
    eventType: 'confirmation',
    transition: 'pending_to_confirmed',
    emailStatus: emailResult.status,
    whatsappStatus: whatsappResult.status,
    emailRecipientPresent: hasEmailRecipient(payload.email),
    whatsappRecipientPresent: hasValidPhoneRecipient(payload.phoneNumber),
    emailEnabled: notificationSettings.emailEnabled,
    whatsappEnabled: notificationSettings.whatsappEnabled,
    businessInfoAvailable: Boolean(payload.businessInfo),
  })

  return {
    bookingId: booking.bookingId,
    transitionDetected: true,
    channels,
    payload,
  }
}

export interface CreateDefaultRuntimeParams {
  brevoApiKey: string
  emailConfig: EmailConfig
  whatsappAccessToken: string
  whatsappConfig: WhatsAppConfig
}

export function createDefaultRuntime(params: CreateDefaultRuntimeParams): NotificationRuntime {
  return {
    emailConfig: params.emailConfig,
    emailService: createBrevoEmailService({
      apiKey: params.brevoApiKey,
      fromEmail: params.emailConfig.fromEmail,
      fromName: params.emailConfig.fromName,
    }),
    whatsappConfig: params.whatsappConfig,
    whatsappService: createMetaWhatsAppService({
      accessToken: params.whatsappAccessToken,
      whatsappConfig: params.whatsappConfig,
    }),
  }
}

export async function handleBookingUpdated(
  db: FirebaseFirestore.Firestore,
  context: BookingUpdateContext,
  settingsReader?: SettingsReader,
  runtime?: NotificationRuntime,
): Promise<DispatchConfirmationResult | null> {
  const beforeStatus = context.before?.status as string | undefined
  const afterStatus = context.after?.status as string | undefined

  if (!isConfirmationTransition(beforeStatus, afterStatus)) {
    logger.debug('Booking update ignored — not a confirmation transition', {
      bookingId: context.bookingId,
      beforeStatus,
      afterStatus,
    })
    return null
  }

  logger.info('Confirmation transition detected', {
    bookingId: context.bookingId,
    beforeStatus,
    afterStatus,
    eventType: 'confirmation',
  })

  const validation = validateBookingSnapshot(context.bookingId, context.after)
  if (!validation.valid || !validation.booking) {
    logger.error('Malformed booking — confirmation notifications aborted', {
      bookingId: context.bookingId,
      error: validation.error,
    })

    return {
      bookingId: context.bookingId,
      transitionDetected: true,
      channels: [],
      error: validation.error,
    }
  }

  return dispatchConfirmationNotifications(
    db,
    validation.booking,
    settingsReader ?? createSettingsReader(db),
    runtime,
  )
}

// Re-export for backward-compatible tests
export { createDeliveryIfAbsent } from './deliveryRepository'
