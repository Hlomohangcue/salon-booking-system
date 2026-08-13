import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret, defineString } from 'firebase-functions/params'
import { getFirestore } from 'firebase-admin/firestore'
import type { NotificationChannel } from '../types/notification'
import {
  createDefaultRuntime,
} from '../services/notificationOrchestrator'
import { resendNotification } from '../services/resendService'

const brevoApiKey = defineSecret('BREVO_API_KEY')
const whatsappAccessToken = defineSecret('WHATSAPP_ACCESS_TOKEN')

const notificationFromEmail = defineString('NOTIFICATION_FROM_EMAIL')
const notificationFromName = defineString('NOTIFICATION_FROM_NAME', {
  default: 'Makeng Salon',
})

const whatsappPhoneNumberId = defineString('WHATSAPP_PHONE_NUMBER_ID')
const whatsappConfirmationTemplate = defineString('WHATSAPP_CONFIRMATION_TEMPLATE')
const whatsappTemplateLanguage = defineString('WHATSAPP_TEMPLATE_LANGUAGE', {
  default: 'en',
})
const whatsappApiVersion = defineString('WHATSAPP_API_VERSION', {
  default: 'v21.0',
})

/**
 * Admin-only callable to manually resend a confirmation notification.
 * Booking content is always rebuilt server-side from Firestore.
 */
export const resendNotificationCallable = onCall(
  {
    region: 'us-central1',
    secrets: [brevoApiKey, whatsappAccessToken],
  },
  async (request) => {
    const bookingId = request.data?.bookingId
    const channel = request.data?.channel

    if (typeof bookingId !== 'string' || typeof channel !== 'string') {
      throw new HttpsError('invalid-argument', 'bookingId and channel are required.')
    }

    const runtime = createDefaultRuntime({
      brevoApiKey: brevoApiKey.value(),
      emailConfig: {
        fromEmail: notificationFromEmail.value(),
        fromName: notificationFromName.value(),
      },
      whatsappAccessToken: whatsappAccessToken.value(),
      whatsappConfig: {
        phoneNumberId: whatsappPhoneNumberId.value(),
        templateName: whatsappConfirmationTemplate.value(),
        templateLanguage: whatsappTemplateLanguage.value(),
        apiVersion: whatsappApiVersion.value(),
      },
    })

    const db = getFirestore()
    return resendNotification(
      db,
      request.auth?.uid,
      {
        bookingId,
        channel: channel as NotificationChannel,
      },
      runtime,
    )
  },
)
