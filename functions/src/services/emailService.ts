import { logger } from 'firebase-functions'
import {
  classifyBrevoError,
  classifyNetworkError,
  EmailServiceError,
  withTransientRetry,
} from '../utils/emailErrors'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export interface SendConfirmationEmailInput {
  toEmail: string
  toName: string
  subject: string
  htmlContent: string
  textContent: string
}

export interface SendConfirmationEmailResult {
  providerMessageId: string
}

export interface EmailService {
  sendConfirmationEmail(input: SendConfirmationEmailInput): Promise<SendConfirmationEmailResult>
}

export interface BrevoEmailServiceConfig {
  apiKey: string
  fromEmail: string
  fromName: string
  /** Injectable fetch for tests. */
  fetchFn?: typeof fetch
}

interface BrevoSuccessResponse {
  messageId?: string
}

/**
 * Sends transactional email via the Brevo REST API.
 * Credentials are server-side only — never logged or returned in errors.
 */
export function createBrevoEmailService(config: BrevoEmailServiceConfig): EmailService {
  const fetchImpl = config.fetchFn ?? fetch

  if (!config.apiKey) {
    throw new EmailServiceError(
      'Brevo API key is not configured.',
      'permanent',
      'provider_not_configured',
    )
  }

  if (!config.fromEmail) {
    throw new EmailServiceError(
      'Sender email (NOTIFICATION_FROM_EMAIL) is not configured.',
      'permanent',
      'sender_not_configured',
    )
  }

  return {
    async sendConfirmationEmail(
      input: SendConfirmationEmailInput,
    ): Promise<SendConfirmationEmailResult> {
      return withTransientRetry(async () => {
        let response: Response
        try {
          response = await fetchImpl(BREVO_API_URL, {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              'api-key': config.apiKey,
            },
            body: JSON.stringify({
              sender: { name: config.fromName, email: config.fromEmail },
              to: [{ email: input.toEmail, name: input.toName }],
              subject: input.subject,
              htmlContent: input.htmlContent,
              textContent: input.textContent,
            }),
          })
        } catch (error) {
          throw classifyNetworkError(error)
        }

        const responseText = await response.text()

        if (!response.ok) {
          throw classifyBrevoError(response.status, responseText)
        }

        let parsed: BrevoSuccessResponse = {}
        if (responseText) {
          try {
            parsed = JSON.parse(responseText) as BrevoSuccessResponse
          } catch {
            parsed = {}
          }
        }

        const providerMessageId = parsed.messageId ?? 'unknown'

        logger.info('Brevo email submitted', {
          channel: 'email',
          provider: 'brevo',
          providerMessageId,
          recipientDomain: input.toEmail.split('@')[1] ?? 'unknown',
        })

        return { providerMessageId }
      })
    },
  }
}
