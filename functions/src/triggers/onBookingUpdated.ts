import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { defineSecret, defineString } from 'firebase-functions/params'
import { getFirestore } from 'firebase-admin/firestore'
import {
  createDefaultRuntime,
  handleBookingUpdated,
} from '../services/notificationOrchestrator'

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
 * Fires when a booking document is updated.
 *
 * Only `* → confirmed` transitions create notification delivery records.
 * Email via Brevo (Phase 4.3). WhatsApp via Meta Cloud API (Phase 4.4).
 */
export const onBookingUpdated = onDocumentUpdated(
  {
    document: 'bookings/{bookingId}',
    region: 'us-central1',
    secrets: [brevoApiKey, whatsappAccessToken],
  },
  async (event) => {
    const bookingId = event.params.bookingId
    const before = event.data?.before.data()
    const after = event.data?.after.data()

    if (!event.data) {
      return
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
    await handleBookingUpdated(db, { bookingId, before, after }, undefined, runtime)
  },
)
