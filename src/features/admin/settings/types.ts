import type { DayOfWeek } from '../../booking/types'

/**
 * Settings & Booking Configuration module types.
 *
 * These types describe the salon's persisted configuration. They are stored
 * under the `settings` collection, split across a few backward-compatible
 * singleton documents:
 *
 *   - settings/bookingConfig   — the SAME document the booking engine reads
 *     via `getBookingConfig()`. Extended with optional fields only so the
 *     customer-facing availability logic is unaffected (Phase 3.6 keeps the
 *     booking engine untouched).
 *   - settings/businessInfo    — salon identity/contact details.
 *   - settings/notifications   — notification toggles/placeholders.
 *   - settings/appearance      — display/format preferences.
 *
 * All timestamps are server-controlled (serverTimestamp()).
 */

/** Theme choice for the public site / admin chrome. */
export type SalonTheme = 'light' | 'dark' | 'system'

/** Date format used across displayed dates. */
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

/** Time format used across displayed times. */
export type TimeFormat = '12h' | '24h'

/** A single weekday's opening/closing window (matches DayHours). */
export interface WorkingHoursDay {
  /** "HH:MM" 24-hour opening time. */
  open: string
  /** "HH:MM" 24-hour closing time. */
  close: string
  /** When true the salon is closed on this weekday. */
  closed: boolean
}

/** Working hours for the whole week. */
export type WorkingHours = Record<DayOfWeek, WorkingHoursDay>

/**
 * Business / salon identity information.
 * Stored at settings/businessInfo.
 */
export interface BusinessInfo {
  /** Salon public name. */
  salonName: string
  /** Main contact phone number (E.164 preferred). */
  phone: string
  /** Public contact email. */
  email: string
  /** Physical street address. */
  address: string
  /** Optional logo URL (CDN / storage). */
  logoUrl?: string
  /** IANA timezone, e.g. "Africa/Maseru". */
  timezone: string
}

/**
 * Notification configuration.
 * Stored at settings/notifications.
 */
export interface NotificationSettings {
  /** Master toggle for email notifications. */
  emailEnabled: boolean
  /** Master toggle for WhatsApp confirmation notifications. */
  whatsappEnabled: boolean
  /** Placeholder — reserved for a future SMS provider integration. */
  smsPlaceholder: string
  /** @deprecated Legacy placeholder — use whatsappEnabled. */
  whatsappPlaceholder: string
}

/**
 * Appearance / display preferences.
 * Stored at settings/appearance.
 */
export interface AppearanceSettings {
  /** Currency code shown with prices, e.g. "M" (Lesotho loti). */
  currency: string
  /** Preferred theme. */
  theme: SalonTheme
  /** Preferred date format. */
  dateFormat: DateFormat
  /** Preferred time format. */
  timeFormat: TimeFormat
}

/**
 * The booking configuration as editable from the admin Settings page.
 *
 * This is a superset of the customer-side `BookingConfig` (from
 * `features/booking/types`). It keeps every existing field so the document is
 * backward-compatible with the booking engine, and adds optional future
 * constraint fields that a later phase will wire into availability.
 *
 * Phase 3.6 stores these extra fields but does NOT yet feed them into the
 * slot generator / availability calculation.
 */
export interface SettingsBookingConfig {
  /** Working hours per weekday. */
  workingHours: WorkingHours
  /** Slot grid granularity in minutes (e.g. 30). */
  slotIntervalMins: number
  /** How many days ahead a customer can book. */
  bookingWindowDays: number
  /** Minimum hours in advance a slot can be booked. */
  minAdvanceHours: number
  /** Max simultaneous bookings per slot. */
  maxBookingsPerSlot: number
  /** ISO date strings "YYYY-MM-DD" — holidays and special closed days. */
  holidays: string[]
  /** Optional: buffer minutes between appointments (future engine wiring). */
  bufferBetweenAppointmentsMins?: number
  /** Optional: maximum bookings allowed per day (future engine wiring). */
  maxBookingsPerDay?: number
  /** Optional: "HH:MM" after which same-day bookings are cut off. */
  sameDayCutoffTime?: string
}

/**
 * The complete, aggregated settings state held by the hook.
 * Container object the Settings page renders section-by-section.
 */
export interface SalonSettings {
  /** Business identity. */
  businessInfo: BusinessInfo
  /** Booking configuration (extended, backward-compatible). */
  bookingConfig: SettingsBookingConfig
  /** Notification toggles/placeholders. */
  notifications: NotificationSettings
  /** Appearance preferences. */
  appearance: AppearanceSettings
}

/** The four settings sections that can be independently saved. */
export type SettingsSection = 'businessInfo' | 'bookingConfig' | 'notifications' | 'appearance'
