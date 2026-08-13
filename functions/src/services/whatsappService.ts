import { logger } from 'firebase-functions'
import {
  buildWhatsAppMessagesUrl,
  type WhatsAppConfig,
} from '../config/whatsappConfig'
import {
  buildConfirmationWhatsAppTemplate,
  type WhatsAppTemplateMessage,
} from '../templates/confirmationWhatsApp'
import type { ConfirmationNotificationPayload } from '../types/notification'
import {
  classifyMetaWhatsAppError,
  classifyWhatsAppNetworkError,
  WhatsAppServiceError,
  withWhatsAppTransientRetry,
} from '../utils/whatsappErrors'

export interface SendConfirmationWhatsAppInput {
  payload: ConfirmationNotificationPayload
  recipientE164: string
}

export interface SendConfirmationWhatsAppResult {
  providerMessageId: string
}

export interface WhatsAppService {
  sendConfirmationWhatsApp(input: SendConfirmationWhatsAppInput): Promise<SendConfirmationWhatsAppResult>
}

export interface MetaWhatsAppServiceConfig {
  accessToken: string
  whatsappConfig: WhatsAppConfig
  /** Injectable fetch for tests. */
  fetchFn?: typeof fetch
}

interface MetaSuccessResponse {
  messages?: Array<{ id?: string }>
}

/**
 * Sends a template message via the Meta WhatsApp Cloud API (Graph API).
 * Access token is server-side only — never logged or returned in errors.
 */
export function createMetaWhatsAppService(config: MetaWhatsAppServiceConfig): WhatsAppService {
  const fetchImpl = config.fetchFn ?? fetch

  if (!config.accessToken) {
    throw new WhatsAppServiceError(
      'WhatsApp access token is not configured.',
      'permanent',
      'provider_not_configured',
    )
  }

  if (!config.whatsappConfig.phoneNumberId) {
    throw new WhatsAppServiceError(
      'WhatsApp phone number ID (WHATSAPP_PHONE_NUMBER_ID) is not configured.',
      'permanent',
      'phone_number_id_not_configured',
    )
  }

  if (!config.whatsappConfig.templateName) {
    throw new WhatsAppServiceError(
      'WhatsApp template name (WHATSAPP_CONFIRMATION_TEMPLATE) is not configured.',
      'permanent',
      'template_not_configured',
    )
  }

  const apiUrl = buildWhatsAppMessagesUrl(config.whatsappConfig)

  return {
    async sendConfirmationWhatsApp(
      input: SendConfirmationWhatsAppInput,
    ): Promise<SendConfirmationWhatsAppResult> {
      return withWhatsAppTransientRetry(async () => {
        const messageBody: WhatsAppTemplateMessage = buildConfirmationWhatsAppTemplate(
          input.payload,
          input.recipientE164,
          config.whatsappConfig,
        )

        let response: Response
        try {
          response = await fetchImpl(apiUrl, {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              authorization: `Bearer ${config.accessToken}`,
            },
            body: JSON.stringify(messageBody),
          })
        } catch (error) {
          throw classifyWhatsAppNetworkError(error)
        }

        const responseText = await response.text()

        if (!response.ok) {
          throw classifyMetaWhatsAppError(response.status, responseText)
        }

        let parsed: MetaSuccessResponse = {}
        if (responseText) {
          try {
            parsed = JSON.parse(responseText) as MetaSuccessResponse
          } catch {
            parsed = {}
          }
        }

        const providerMessageId = parsed.messages?.[0]?.id ?? 'unknown'

        logger.info('Meta WhatsApp message submitted', {
          channel: 'whatsapp',
          provider: 'meta-whatsapp',
          providerMessageId,
          recipientCountry: input.recipientE164.slice(0, 4),
        })

        return { providerMessageId }
      })
    },
  }
}
