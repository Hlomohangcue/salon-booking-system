import { db } from '../../../lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore'
import { FIRESTORE_COLLECTIONS, type DayOfWeek } from '../../booking/types'
import { WEEKDAY_KEYS } from './settingsValidation'
import type {
  BusinessInfo,
  NotificationSettings,
  AppearanceSettings,
  SettingsBookingConfig,
  WorkingHours,
  WorkingHoursDay,
  SalonSettings,
} from './types'

/**
 * Settings & Booking Configuration service.
 *
 * Owns all Firestore reads/writes for the salon settings module. Business logic
 * (default-merging, shape conversion, persistence) lives here and nowhere else.
 *
 * Persistence model (backward compatible):
 *   - settings/bookingConfig — the SAME document the booking engine reads.
 *     We write the customer-facing shape (`openingHours` as `DayHours`) so the
 *     availability logic is never affected, while preserving new optional
 *     fields (buffer, maxBookingsPerDay, sameDayCutoffTime) for future use.
 *   - settings/businessInfo, settings/notifications, settings/appearance —
 *     new singleton documents.
 *
 * All writes use serverTimestamp() for updatedAt.
 */

/** Stable, user-friendly error for settings-management failures. */
export class SettingsError extends Error {
  readonly code: 'NOT_FOUND' | 'UNKNOWN'

  constructor(code: SettingsError['code'], message: string) {
    super(message)
    this.name = 'SettingsError'
    this.code = code
  }
}

/** Maps an unknown error to a SettingsError with a stable code. */
export function toSettingsError(error: unknown): SettingsError {
  if (error instanceof SettingsError) return error
  const message = error instanceof Error ? error.message : undefined
  return new SettingsError(
    'UNKNOWN',
    message ?? 'Something went wrong while saving settings. Please try again.',
  )
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_WORKING_HOURS_DAY: WorkingHoursDay = {
  open: '08:00',
  close: '17:00',
  closed: false,
}

function defaultWorkingHours(): WorkingHours {
  const hours = {} as WorkingHours
  for (const key of WEEKDAY_KEYS) {
    hours[key] = { ...DEFAULT_WORKING_HOURS_DAY }
  }
  return hours
}

const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  salonName: 'Makeng Salon',
  phone: '+266',
  email: '',
  address: '',
  timezone: 'Africa/Maseru',
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailEnabled: false,
  smsPlaceholder: '',
  whatsappPlaceholder: '',
}

const DEFAULT_APPEARANCE: AppearanceSettings = {
  currency: 'M',
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
}

/** Backward-compatible default booking config (matches the seed document). */
const DEFAULT_BOOKING_CONFIG: SettingsBookingConfig = {
  workingHours: defaultWorkingHours(),
  slotIntervalMins: 30,
  bookingWindowDays: 30,
  minAdvanceHours: 2,
  maxBookingsPerSlot: 1,
  holidays: [],
}

// ─── Shape conversion (customer BookingConfig <-> SettingsBookingConfig) ─────

/**
 * Convert a raw `settings/bookingConfig` Firestore document into the editable
 * SettingsBookingConfig shape. Missing optional fields are defaulted so older
 * documents (without the new Phase 3.6 fields) always load cleanly.
 */
function toSettingsBookingConfig(data: DocumentData): SettingsBookingConfig {
  const rawOpening = data.openingHours as
    | Record<DayOfWeek, { open?: string; close?: string; closed?: boolean }>
    | undefined

  const workingHours = defaultWorkingHours()
  if (rawOpening) {
    for (const key of WEEKDAY_KEYS) {
      const day = rawOpening[key]
      if (day) {
        workingHours[key] = {
          open: day.open ?? DEFAULT_WORKING_HOURS_DAY.open,
          close: day.close ?? DEFAULT_WORKING_HOURS_DAY.close,
          closed: day.closed ?? false,
        }
      }
    }
  }

  return {
    workingHours,
    slotIntervalMins: data.slotIntervalMins ?? DEFAULT_BOOKING_CONFIG.slotIntervalMins,
    bookingWindowDays: data.bookingWindowDays ?? DEFAULT_BOOKING_CONFIG.bookingWindowDays,
    minAdvanceHours: data.minAdvanceHours ?? DEFAULT_BOOKING_CONFIG.minAdvanceHours,
    maxBookingsPerSlot: data.maxBookingsPerSlot ?? DEFAULT_BOOKING_CONFIG.maxBookingsPerSlot,
    holidays: Array.isArray(data.holidays) ? data.holidays : [],
    bufferBetweenAppointmentsMins:
      data.bufferBetweenAppointmentsMins ?? undefined,
    maxBookingsPerDay: data.maxBookingsPerDay ?? undefined,
    sameDayCutoffTime: data.sameDayCutoffTime ?? undefined,
  }
}

/**
 * Convert SettingsBookingConfig back into the customer-facing document shape
 * (`openingHours` as `DayHours`). The booking engine reads this exact shape, so
 * it must remain byte-compatible with the seeded config.
 */
function toBookingConfigDocument(config: SettingsBookingConfig): DocumentData {
  const openingHours = {} as Record<DayOfWeek, { open: string; close: string; closed?: boolean }>
  for (const key of WEEKDAY_KEYS) {
    openingHours[key] = {
      open: config.workingHours[key].open,
      close: config.workingHours[key].close,
      // Only include `closed` when true to match the compact seed shape.
      closed: config.workingHours[key].closed ? true : undefined,
    }
  }

  return {
    openingHours,
    slotIntervalMins: config.slotIntervalMins,
    bookingWindowDays: config.bookingWindowDays,
    minAdvanceHours: config.minAdvanceHours,
    maxBookingsPerSlot: config.maxBookingsPerSlot,
    holidays: config.holidays,
    ...(config.bufferBetweenAppointmentsMins !== undefined
      ? { bufferBetweenAppointmentsMins: config.bufferBetweenAppointmentsMins }
      : {}),
    ...(config.maxBookingsPerDay !== undefined
      ? { maxBookingsPerDay: config.maxBookingsPerDay }
      : {}),
    ...(config.sameDayCutoffTime ? { sameDayCutoffTime: config.sameDayCutoffTime } : {}),
  }
}

// ─── Fetch ──────────────────────────────────────────────────────────────────

/**
 * Load all settings documents in parallel and aggregate them into a single
 * SalonSettings object. Missing documents fall back to defaults so the page
 * always renders instead of erroring on a first visit.
 */
export async function getSalonSettings(): Promise<SalonSettings> {
  const [bookingSnap, businessSnap, notificationSnap, appearanceSnap] = await Promise.all([
    getDoc(doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'bookingConfig')),
    getDoc(doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'businessInfo')),
    getDoc(doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'notifications')),
    getDoc(doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'appearance')),
  ])

  return {
    bookingConfig: bookingSnap.exists()
      ? toSettingsBookingConfig(bookingSnap.data())
      : { ...DEFAULT_BOOKING_CONFIG, workingHours: defaultWorkingHours() },
    businessInfo: businessSnap.exists()
      ? { ...DEFAULT_BUSINESS_INFO, ...businessSnap.data() }
      : { ...DEFAULT_BUSINESS_INFO },
    notifications: notificationSnap.exists()
      ? { ...DEFAULT_NOTIFICATIONS, ...notificationSnap.data() }
      : { ...DEFAULT_NOTIFICATIONS },
    appearance: appearanceSnap.exists()
      ? { ...DEFAULT_APPEARANCE, ...appearanceSnap.data() }
      : { ...DEFAULT_APPEARANCE },
  }
}

/**
 * Fetch the list of holiday documents from the `holidays` collection.
 * Returns the raw docs so the admin can see any holidays that exist outside the
 * embedded `bookingConfig.holidays` array (legacy collection).
 */
export async function getLegacyHolidays(): Promise<DocumentData[]> {
  const snap = await getDocs(collection(db, 'holidays'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ─── Mutations (explicit methods) ───────────────────────────────────────────

/**
 * Persist business identity information to settings/businessInfo.
 * Uses setDoc (upsert) so the document is created on first save.
 */
export async function saveBusinessInfo(info: BusinessInfo): Promise<void> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'businessInfo')
  await setDoc(ref, {
    ...info,
    logoUrl: info.logoUrl ?? '',
    updatedAt: serverTimestamp(),
  })
}

/**
 * Persist booking configuration to settings/bookingConfig.
 * Writes the customer-facing document shape so the booking engine is unaffected.
 */
export async function saveBookingConfig(
  config: SettingsBookingConfig,
): Promise<void> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'bookingConfig')
  await setDoc(ref, {
    ...toBookingConfigDocument(config),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Persist notification settings to settings/notifications.
 */
export async function saveNotifications(
  notifications: NotificationSettings,
): Promise<void> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'notifications')
  await setDoc(ref, {
    ...notifications,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Persist appearance preferences to settings/appearance.
 */
export async function saveAppearance(
  appearance: AppearanceSettings,
): Promise<void> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.SETTINGS, 'appearance')
  await setDoc(ref, {
    ...appearance,
    updatedAt: serverTimestamp(),
  })
}
