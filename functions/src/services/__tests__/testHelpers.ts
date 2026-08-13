import type { EmailService } from '../emailService'
import type { WhatsAppService } from '../whatsappService'
import { createDefaultRuntime } from '../notificationOrchestrator'

export function makeRuntime(emailService: EmailService, whatsappService: WhatsAppService) {
  const runtime = createDefaultRuntime({
    brevoApiKey: 'test-key',
    emailConfig: { fromEmail: 'bookings@makeng.test', fromName: 'Makeng Salon' },
    whatsappAccessToken: 'test-token',
    whatsappConfig: {
      phoneNumberId: '123456789',
      templateName: 'appointment_confirmation',
      templateLanguage: 'en',
      apiVersion: 'v21.0',
    },
  })
  return {
    ...runtime,
    emailService,
    whatsappService,
  }
}
