/**
 * WhatsApp / Meta Cloud API configuration (non-secret parameters).
 */

export interface WhatsAppConfig {
  phoneNumberId: string
  templateName: string
  templateLanguage: string
  /** Meta Graph API version — default v21.0 (Jan 2025 stable). */
  apiVersion: string
}

const DEFAULT_API_VERSION = 'v21.0'
const DEFAULT_TEMPLATE_LANGUAGE = 'en'

/** Reads non-secret WhatsApp configuration from environment variables. */
export function getWhatsAppConfigFromEnv(env: NodeJS.ProcessEnv = process.env): WhatsAppConfig {
  return {
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? '',
    templateName: env.WHATSAPP_CONFIRMATION_TEMPLATE?.trim() ?? '',
    templateLanguage: env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || DEFAULT_TEMPLATE_LANGUAGE,
    apiVersion: env.WHATSAPP_API_VERSION?.trim() || DEFAULT_API_VERSION,
  }
}

/** Returns true when the minimum Meta API configuration is present. */
export function isWhatsAppConfigValid(config: WhatsAppConfig): boolean {
  return config.phoneNumberId.length > 0 && config.templateName.length > 0
}

export function buildWhatsAppMessagesUrl(config: WhatsAppConfig): string {
  return `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`
}
