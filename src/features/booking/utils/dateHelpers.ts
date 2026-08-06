import { format, addDays } from 'date-fns'
import type { DayOfWeek } from '../types'

/** Format a Date to ISO date string "YYYY-MM-DD" */
export function formatDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Format a Date to 24-hour time string "HH:MM" */
export function formatTimeStr(date: Date): string {
  return format(date, 'HH:mm')
}

/** Parse "YYYY-MM-DD" to a Date at midnight local time */
export function parseDateStr(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Returns true if "YYYY-MM-DD" represents a valid calendar date */
export function isValidDateStr(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

/**
 * Returns true if the date string is before today in local time.
 * Uses lexicographic comparison — safe because ISO date strings are naturally ordered.
 */
export function isDateInPast(dateStr: string): boolean {
  return dateStr < formatDateStr(new Date())
}

/**
 * Returns true if the date falls within the booking window [today, today + windowDays].
 */
export function isDateWithinWindow(dateStr: string, windowDays: number): boolean {
  const today = formatDateStr(new Date())
  const maxDate = formatDateStr(addDays(new Date(), windowDays))
  return dateStr >= today && dateStr <= maxDate
}

/**
 * Returns true if the slot datetime is at least minAdvanceHours from now.
 * Creates the slot Date in local time to avoid UTC timezone ambiguity.
 */
export function isSlotInAdvance(dateStr: string, timeStr: string, minAdvanceHours: number): boolean {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
  const minBookingTime = new Date(Date.now() + minAdvanceHours * 60 * 60 * 1000)
  return slotDate > minBookingTime
}

/** Returns the DayOfWeek key for an ISO date string ("mon", "tue", …) */
export function getDayOfWeek(dateStr: string): DayOfWeek {
  const [year, month, day] = dateStr.split('-').map(Number)
  const dayIndex = new Date(year, month - 1, day).getDay()
  const days: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return days[dayIndex]
}

/** Returns true if the date is in the holidays or special closed-days list */
export function isHoliday(dateStr: string, holidays: string[]): boolean {
  return holidays.includes(dateStr)
}

/**
 * Normalise a Lesotho phone number to E.164 format (+266XXXXXXXX).
 * Accepts: +26652…, 26652…, 52… (8 local digits starting with 2–8).
 * Returns the input unchanged if the format is unrecognised — validation catches it.
 */
export function normalizePhone(phone: string): string {
  const stripped = phone.replace(/[-\s().]/g, '')
  if (stripped.startsWith('+266')) return stripped
  if (stripped.startsWith('266')) return `+${stripped}`
  if (/^[2-8]\d{7}$/.test(stripped)) return `+266${stripped}`
  return stripped
}

/** Convert a "HH:MM" string to total minutes from midnight */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/** Convert total minutes from midnight to a "HH:MM" string */
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Add a number of minutes to a "HH:MM" string.
 * Returns null if the result would exceed 23:59.
 */
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string | null {
  const total = timeToMinutes(timeStr) + minutesToAdd
  if (total >= 24 * 60) return null
  return minutesToTime(total)
}

// Reuse a single formatter instance for performance
const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** Format "YYYY-MM-DD" as "Monday, 5 August 2026" for human-readable display. */
export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return DISPLAY_DATE_FORMATTER.format(new Date(year, month - 1, day))
}

/** Convert a "HH:MM" 24-hour string to "9:00 AM" / "1:30 PM" format. */
export function formatTime12h(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}
