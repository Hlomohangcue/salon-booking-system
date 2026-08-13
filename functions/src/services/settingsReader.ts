import type {
  BusinessInfoSnapshot,
  NotificationSettingsSnapshot,
} from '../types/notification'

const DEFAULT_BUSINESS_INFO: BusinessInfoSnapshot = {
  salonName: 'Makeng Salon',
  phone: '',
  email: '',
  address: '',
  timezone: 'Africa/Maseru',
}

/** Matches adminSettingsService DEFAULT_NOTIFICATIONS — notifications off when unset. */
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsSnapshot = {
  emailEnabled: false,
  whatsappEnabled: false,
}

export interface SettingsReader {
  getBusinessInfo(): Promise<BusinessInfoSnapshot | undefined>
  getNotificationSettings(): Promise<NotificationSettingsSnapshot>
}

/**
 * Reads salon settings documents via Admin SDK.
 */
export function createSettingsReader(db: FirebaseFirestore.Firestore): SettingsReader {
  return {
    async getBusinessInfo(): Promise<BusinessInfoSnapshot | undefined> {
      const snap = await db.collection('settings').doc('businessInfo').get()
      if (!snap.exists) {
        return undefined
      }

      const data = snap.data()
      if (!data) {
        return undefined
      }

      return {
        salonName:
          typeof data.salonName === 'string' && data.salonName.trim().length > 0
            ? data.salonName
            : DEFAULT_BUSINESS_INFO.salonName,
        phone: typeof data.phone === 'string' ? data.phone : DEFAULT_BUSINESS_INFO.phone,
        email: typeof data.email === 'string' ? data.email : DEFAULT_BUSINESS_INFO.email,
        address:
          typeof data.address === 'string' ? data.address : DEFAULT_BUSINESS_INFO.address,
        timezone:
          typeof data.timezone === 'string' && data.timezone.trim().length > 0
            ? data.timezone
            : DEFAULT_BUSINESS_INFO.timezone,
      }
    },

    async getNotificationSettings(): Promise<NotificationSettingsSnapshot> {
      const snap = await db.collection('settings').doc('notifications').get()
      if (!snap.exists) {
        return { ...DEFAULT_NOTIFICATION_SETTINGS }
      }

      const data = snap.data()
      return {
        emailEnabled:
          typeof data?.emailEnabled === 'boolean'
            ? data.emailEnabled
            : DEFAULT_NOTIFICATION_SETTINGS.emailEnabled,
        whatsappEnabled:
          typeof data?.whatsappEnabled === 'boolean'
            ? data.whatsappEnabled
            : DEFAULT_NOTIFICATION_SETTINGS.whatsappEnabled,
      }
    },
  }
}
