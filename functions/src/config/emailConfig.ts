/**
 * Email-related configuration read from Cloud Functions environment.
 * Secrets (BREVO_API_KEY) are injected separately via defineSecret.
 */

export interface EmailConfig {
  fromEmail: string
  fromName: string
}

const DEFAULT_FROM_NAME = 'Makeng Salon'

/** Reads non-secret email sender configuration from environment variables. */
export function getEmailConfigFromEnv(env: NodeJS.ProcessEnv = process.env): EmailConfig {
  return {
    fromEmail: env.NOTIFICATION_FROM_EMAIL?.trim() ?? '',
    fromName: env.NOTIFICATION_FROM_NAME?.trim() || DEFAULT_FROM_NAME,
  }
}

/** Returns true when the minimum sender configuration is present. */
export function isEmailConfigValid(config: EmailConfig): boolean {
  return config.fromEmail.length > 0 && config.fromEmail.includes('@')
}
