import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getSalonSettings,
  saveBusinessInfo,
  saveBookingConfig,
  saveNotifications,
  saveAppearance,
  toSettingsError,
  SettingsError,
} from './adminSettingsService'
import type {
  BusinessInfo,
  NotificationSettings,
  AppearanceSettings,
  SettingsBookingConfig,
  SalonSettings,
  SettingsSection,
} from './types'

/** The set of settings loaded from Firestore. */
const EMPTY_SETTINGS: SalonSettings = {
  businessInfo: {
    salonName: '',
    phone: '+266',
    email: '',
    address: '',
    timezone: '',
  },
  bookingConfig: {
    workingHours: {
      mon: { open: '08:00', close: '17:00', closed: false },
      tue: { open: '08:00', close: '17:00', closed: false },
      wed: { open: '08:00', close: '17:00', closed: false },
      thu: { open: '08:00', close: '17:00', closed: false },
      fri: { open: '08:00', close: '17:00', closed: false },
      sat: { open: '08:00', close: '17:00', closed: false },
      sun: { open: '08:00', close: '17:00', closed: false },
    },
    slotIntervalMins: 30,
    bookingWindowDays: 30,
    minAdvanceHours: 2,
    maxBookingsPerSlot: 1,
    holidays: [],
  },
  notifications: {
    emailEnabled: false,
    whatsappEnabled: false,
    smsPlaceholder: '',
    whatsappPlaceholder: '',
  },
  appearance: {
    currency: 'M',
    theme: 'light',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  },
}

export interface UseAdminSettingsReturn {
  /** Aggregated settings state. */
  settings: SalonSettings
  loading: boolean
  /** Human-readable load error, or null when idle/success. */
  error: string | null
  /** Re-fetch all settings from Firestore. */
  refresh: () => Promise<void>
  /** Whether a save is currently in flight. */
  saving: boolean
  /** The section for the in-flight / last save, or null. */
  savingSection: SettingsSection | null
  /** Success message from the last save, or null. */
  successMessage: string | null
  /** Per-section save error message, or null. */
  saveError: string | null
  /** Save the business info section. */
  saveBusinessInfo: (info: BusinessInfo) => Promise<void>
  /** Save the booking configuration section. */
  saveBookingConfig: (config: SettingsBookingConfig) => Promise<void>
  /** Save the notifications section. */
  saveNotifications: (n: NotificationSettings) => Promise<void>
  /** Save the appearance section. */
  saveAppearance: (a: AppearanceSettings) => Promise<void>
}

/**
 * Settings hook.
 *
 * Loads all settings once (in parallel) on mount. Each section save
 * optimistically updates local state after a successful Firestore write and
 * reports a human-readable success/error message. No full reload is triggered
 * on save — keeping Firestore reads to a minimum.
 */
export function useAdminSettings(): UseAdminSettingsReturn {
  const [settings, setSettings] = useState<SalonSettings>(EMPTY_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingSection, setSavingSection] = useState<SettingsSection | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSalonSettings()
      setSettings(data)
    } catch (err: unknown) {
      const settingsError: SettingsError = toSettingsError(err)
      setError(settingsError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const runMutation = useCallback(
    async <T,>(
      section: SettingsSection,
      action: () => Promise<T>,
      message: string,
    ): Promise<T> => {
      setSaving(true)
      setSavingSection(section)
      setSuccessMessage(null)
      setSaveError(null)
      try {
        const result = await action()
        setSuccessMessage(message)
        return result
      } catch (err: unknown) {
        const settingsError: SettingsError = toSettingsError(err)
        setSaveError(settingsError.message)
        throw settingsError
      } finally {
        setSaving(false)
        setSavingSection(null)
      }
    },
    [],
  )

  const saveBusinessInfoAction = useCallback(
    (info: BusinessInfo): Promise<void> =>
      runMutation(
        'businessInfo',
        async () => {
          await saveBusinessInfo(info)
          setSettings((prev) => ({ ...prev, businessInfo: info }))
        },
        'Business information saved successfully',
      ),
    [runMutation],
  )

  const saveBookingConfigAction = useCallback(
    (config: SettingsBookingConfig): Promise<void> =>
      runMutation(
        'bookingConfig',
        async () => {
          await saveBookingConfig(config)
          setSettings((prev) => ({ ...prev, bookingConfig: config }))
        },
        'Booking settings saved successfully',
      ),
    [runMutation],
  )

  const saveNotificationsAction = useCallback(
    (n: NotificationSettings): Promise<void> =>
      runMutation(
        'notifications',
        async () => {
          await saveNotifications(n)
          setSettings((prev) => ({ ...prev, notifications: n }))
        },
        'Notification settings saved successfully',
      ),
    [runMutation],
  )

  const saveAppearanceAction = useCallback(
    (a: AppearanceSettings): Promise<void> =>
      runMutation(
        'appearance',
        async () => {
          await saveAppearance(a)
          setSettings((prev) => ({ ...prev, appearance: a }))
        },
        'Appearance settings saved successfully',
      ),
    [runMutation],
  )

  return useMemo(
    () => ({
      settings,
      loading,
      error,
      refresh,
      saving,
      savingSection,
      successMessage,
      saveError,
      saveBusinessInfo: saveBusinessInfoAction,
      saveBookingConfig: saveBookingConfigAction,
      saveNotifications: saveNotificationsAction,
      saveAppearance: saveAppearanceAction,
    }),
    [
      settings,
      loading,
      error,
      refresh,
      saving,
      savingSection,
      successMessage,
      saveError,
      saveBusinessInfoAction,
      saveBookingConfigAction,
      saveNotificationsAction,
      saveAppearanceAction,
    ],
  )
}
