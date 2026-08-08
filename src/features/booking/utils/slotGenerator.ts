import type { BookingConfig } from '../types'
import {
  getDayOfWeek,
  isHoliday,
  timeToMinutes,
  minutesToTime,
  isSlotInAdvance,
  isDateWithinWindow,
  formatDateStr,
} from './dateHelpers'

interface SlotGeneratorParams {
  /** ISO date string "YYYY-MM-DD" */
  date: string
  config: BookingConfig
  /** Duration of the service being booked (minutes) — used for both grid step and conflict detection */
  serviceDurationMins: number
  /**
   * Start times ("HH:MM") already booked for this date.
   */
  bookedSlots: string[]
}

/**
 * Generate all available time slots for a given date.
 *
 * A slot is excluded when:
 * - The day is closed (weekend config, closed flag, or holiday)
 * - The date falls outside the configured booking window
 * - The day has already reached maxBookingsPerDay (when configured)
 * - The slot datetime is before the same-day cutoff (when configured)
 * - The slot is in the past or within minAdvanceHours of now
 * - The slot overlaps with an existing booking's service window (widened by
 *   the configured inter-appointment buffer)
 *
 * @returns Array of available "HH:MM" start-time strings
 */
export function generateAvailableSlots({
  date,
  config,
  serviceDurationMins,
  bookedSlots,
}: SlotGeneratorParams): string[] {
  // Phase 3.7: enforce booking window. If the date is outside
  // [today, today + bookingWindowDays], no slots are available.
  if (!isDateWithinWindow(date, config.bookingWindowDays)) {
    return []
  }

  const dayKey = getDayOfWeek(date)
  const dayConfig = config.openingHours[dayKey]

  if (!dayConfig || dayConfig.closed === true || isHoliday(date, config.holidays)) {
    return []
  }

  const openMins = timeToMinutes(dayConfig.open)
  const closeMins = timeToMinutes(dayConfig.close)
  const { slotIntervalMins, minAdvanceHours } = config

  // Phase 3.7: enforce max bookings per day. Once the day is full, no free
  // slots remain (backward compatible — undefined means uncapped).
  if (
    config.maxBookingsPerDay !== undefined &&
    bookedSlots.length >= config.maxBookingsPerDay
  ) {
    return []
  }

  // Phase 3.7: enforce same-day cutoff. When the requested date is today and
  // a cutoff time is configured, slots at/before the cutoff are unavailable.
  const todayStr = formatDateStr(new Date())
  if (date === todayStr && config.sameDayCutoffTime) {
    const cutoffMins = timeToMinutes(config.sameDayCutoffTime)
    if (openMins < cutoffMins) return []
  }

  // Build all candidate slot start times that fit before closing
  const candidates: string[] = []
  for (let mins = openMins; mins + serviceDurationMins <= closeMins; mins += slotIntervalMins) {
    candidates.push(minutesToTime(mins))
  }

  // Phase 3.7: widen each booked slot's occupied window by the configured
  // inter-appointment buffer (backward compatible — undefined buffer = 0).
  const bufferMins = config.bufferBetweenAppointmentsMins ?? 0
  const blockedRanges = bookedSlots.map((slot) => ({
    start: timeToMinutes(slot),
    end: timeToMinutes(slot) + serviceDurationMins + bufferMins,
  }))

  return candidates.filter((slot) => {
    const slotStart = timeToMinutes(slot)
    const slotEnd = slotStart + serviceDurationMins

    if (!isSlotInAdvance(date, slot, minAdvanceHours)) return false

    return !blockedRanges.some(
      (range) => slotStart < range.end && slotEnd > range.start,
    )
  })
}

/**
 * Generate all candidate slots for a day without any availability filtering.
 * Useful for admin schedule views that need the full day grid.
 *
 * @returns Array of all "HH:MM" slot strings for the day
 */
export function generateAllSlots(date: string, config: BookingConfig): string[] {
  const dayKey = getDayOfWeek(date)
  const dayConfig = config.openingHours[dayKey]

  if (!dayConfig || dayConfig.closed === true || isHoliday(date, config.holidays)) {
    return []
  }

  const openMins = timeToMinutes(dayConfig.open)
  const closeMins = timeToMinutes(dayConfig.close)
  const slots: string[] = []

  for (let mins = openMins; mins < closeMins; mins += config.slotIntervalMins) {
    slots.push(minutesToTime(mins))
  }

  return slots
}
