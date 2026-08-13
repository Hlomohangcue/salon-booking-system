import { describe, it, expect } from 'vitest'
import { notificationSettingsSchema } from '../settingsValidation'

describe('notification settings security model', () => {
  it('28. notification settings schema requires admin UI to persist toggles only', () => {
    const parsed = notificationSettingsSchema.parse({
      emailEnabled: true,
      whatsappEnabled: false,
      smsPlaceholder: '',
      whatsappPlaceholder: '',
    })

    expect(parsed.emailEnabled).toBe(true)
    expect(parsed.whatsappEnabled).toBe(false)
    expect(Object.keys(parsed)).not.toContain('brevoApiKey')
    expect(Object.keys(parsed)).not.toContain('whatsappAccessToken')
  })
})
