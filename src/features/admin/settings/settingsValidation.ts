import { z } from 'zod'
import type { DayOfWeek } from '../../booking/types'
import type {
  SalonTheme,
  DateFormat,
  TimeFormat,
} from './types'

/**
 * Zod validation schemas for every editable settings section.
 *
 * Each schema mirrors the corresponding type in `types.ts` and is consumed by
 * `react-hook-form` + `@hookform/resolvers/zod` in the settings forms. All
 * schemas are strongly typed (no `any`) and produce inferred input/output types.
 */

// ─── Shared helpers ─────────────────────────────────────────────────────────

/** Custom error message factory for strict enum values. */
function enumError(label: string): string {
  return `Please choose a valid ${label}`
}

/** Time as "HH:MM" 24-hour. */
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

/** ISO date string "YYYY-MM-DD". */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/** All weekday keys in the canonical order. */
export const WEEKDAY_KEYS: readonly DayOfWeek[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const

/** Labels for each weekday, used by the working-hours editor. */
export const WEEKDAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

// ─── Business info ──────────────────────────────────────────────────────────

export const businessInfoSchema = z.object({
  salonName: z
    .string()
    .min(1, 'Salon name is required')
    .max(120, 'Salon name must be 120 characters or fewer'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .max(30, 'Phone must be 30 characters or fewer'),
  email: z
    .string()
    .email('Enter a valid email address')
    .max(120, 'Email must be 120 characters or fewer'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(200, 'Address must be 200 characters or fewer'),
  logoUrl: z
    .string()
    .url('Enter a valid URL')
    .max(500, 'Logo URL must be 500 characters or fewer')
    .optional()
    .or(z.literal('')),
  timezone: z
    .string()
    .min(1, 'Timezone is required')
    .max(64, 'Timezone must be 64 characters or fewer'),
})

export type BusinessInfoInput = z.input<typeof businessInfoSchema>
export type BusinessInfoOutput = z.output<typeof businessInfoSchema>

// ─── Working hours (per-day subsection) ─────────────────────────────────────

/** Validates a single weekday's hours. */
export const workingHoursDaySchema = z.object({
  open: z
    .string()
    .regex(TIME_REGEX, 'Use HH:MM 24-hour format'),
  close: z
    .string()
    .regex(TIME_REGEX, 'Use HH:MM 24-hour format'),
  closed: z.boolean(),
}).refine(
  (day) => day.closed || day.open < day.close,
  { message: 'Opening time must be before closing time', path: ['close'] },
)

/** Validates the full week's working hours. */
export const workingHoursSchema = z.object(
  Object.fromEntries(
    WEEKDAY_KEYS.map((key) => [key, workingHoursDaySchema]),
  ) as unknown as Record<DayOfWeek, typeof workingHoursDaySchema>,
)

// ─── Booking settings (bookingConfig) ───────────────────────────────────────

export const bookingSettingsSchema = z.object({
  slotIntervalMins: z.coerce
    .number({ error: 'Slot interval is required' })
    .int('Slot interval must be a whole number')
    .min(5, 'Slot interval must be at least 5 minutes')
    .max(240, 'Slot interval must be 240 minutes or fewer'),
  bookingWindowDays: z.coerce
    .number({ error: 'Booking window is required' })
    .int('Booking window must be a whole number')
    .min(1, 'Booking window must be at least 1 day')
    .max(365, 'Booking window must be 365 days or fewer'),
  minAdvanceHours: z.coerce
    .number({ error: 'Lead time is required' })
    .int('Lead time must be a whole number')
    .min(0, 'Lead time must be 0 or greater')
    .max(168, 'Lead time must be 168 hours or fewer'),
  maxBookingsPerSlot: z.coerce
    .number({ error: 'Max bookings per slot is required' })
    .int('Value must be a whole number')
    .min(1, 'Must be at least 1')
    .max(20, 'Must be 20 or fewer'),
  bufferBetweenAppointmentsMins: z.coerce
    .number({ error: 'Buffer is required' })
    .int('Buffer must be a whole number')
    .min(0, 'Buffer must be 0 or greater')
    .max(480, 'Buffer must be 480 minutes or fewer')
    .optional(),
  maxBookingsPerDay: z.coerce
    .number({ error: 'Daily max is required' })
    .int('Daily max must be a whole number')
    .min(1, 'Daily max must be at least 1')
    .max(1000, 'Daily max must be 1000 or fewer')
    .optional(),
  sameDayCutoffTime: z
    .string()
    .regex(TIME_REGEX, 'Use HH:MM 24-hour format')
    .optional()
    .or(z.literal('')),
})

export type BookingSettingsInput = z.input<typeof bookingSettingsSchema>
export type BookingSettingsOutput = z.output<typeof bookingSettingsSchema>

// ─── Notifications ──────────────────────────────────────────────────────────

export const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean(),
  smsPlaceholder: z
    .string()
    .max(200, 'SMS placeholder must be 200 characters or fewer')
    .default(''),
  whatsappPlaceholder: z
    .string()
    .max(200, 'WhatsApp placeholder must be 200 characters or fewer')
    .default(''),
})

export type NotificationSettingsInput = z.input<typeof notificationSettingsSchema>
export type NotificationSettingsOutput = z.output<typeof notificationSettingsSchema>

// ─── Appearance ─────────────────────────────────────────────────────────────

export const appearanceSettingsSchema = z.object({
  currency: z
    .string()
    .min(1, 'Currency is required')
    .max(10, 'Currency must be 10 characters or fewer'),
  theme: z.enum(['light', 'dark', 'system'] as const, {
    error: enumError('theme'),
  }),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const, {
    error: enumError('date format'),
  }),
  timeFormat: z.enum(['12h', '24h'] as const, {
    error: enumError('time format'),
  }),
})

export type AppearanceSettingsInput = z.input<typeof appearanceSettingsSchema>
export type AppearanceSettingsOutput = z.output<typeof appearanceSettingsSchema>

// ─── Holiday management ─────────────────────────────────────────────────────

export const holidaySchema = z.object({
  /** ISO date "YYYY-MM-DD". */
  date: z
    .string()
    .regex(DATE_REGEX, 'Use YYYY-MM-DD format'),
  /** Human-readable holiday name. */
  name: z
    .string()
    .min(1, 'Name is required')
    .max(80, 'Name must be 80 characters or fewer'),
  /** When true the holiday recurs on the same date every year. */
  recurring: z.boolean(),
})

export type HolidayInput = z.input<typeof holidaySchema>
export type HolidayOutput = z.output<typeof holidaySchema>

// ─── Re-exported option lists for the forms ─────────────────────────────────

export const THEME_OPTIONS: readonly { value: SalonTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const

export const DATE_FORMAT_OPTIONS: readonly { value: DateFormat; label: string }[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
] as const

export const TIME_FORMAT_OPTIONS: readonly { value: TimeFormat; label: string }[] = [
  { value: '12h', label: '12-hour (AM/PM)' },
  { value: '24h', label: '24-hour' },
] as const
