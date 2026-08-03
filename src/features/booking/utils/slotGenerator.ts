import type { BookingConfig } from '../types'
import {
  getDayOfWeek,
  isHoliday,
  timeToMinutes,
  minutesToTime,
  isSlotInAdvance,
} from './dateHelpers'

interface SlotGeneratorParams {
  /** ISO date string "YYYY-MM-DD" */
  date: string
  config: BookingConfig
  /** Duration of the service being booked (minutes) — used for both grid step and conflict detection */
  serviceDurationMins: number
  /**
   * Start times ("HH:MM") already booked for this date.
   * Phase 3.2: enhance to include per-booking durations for accurate overlap detection.
   */
  bookedSlots: string[]
}

/**
 * Generate all available time slots for a given date.
 *
 * A slot is excluded when:
 * - The day is closed (weekend config, closed flag, or holiday)
 * - The slot is in the past or within minAdvanceHours of now
 * - The slot overlaps with an existing booking's service window
 *
 * @returns Array of available "HH:MM" start-time strings
 */
export function generateAvailableSlots({
  date,
  config,
  serviceDurationMins,
  bookedSlots,
}: SlotGeneratorParams): string[] {
  const dayKey = getDayOfWeek(date)
  const dayConfig = config.openingHours[dayKey]

  if (!dayConfig || dayConfig.closed === true || isHoliday(date, config.holidays)) {
    return []
  }

  const openMins = timeToMinutes(dayConfig.open)
  const closeMins = timeToMinutes(dayConfig.close)
  const { slotIntervalMins, minAdvanceHours } = config

  // Build all candidate slot start times that fit before closing
  const candidates: string[] = []
  for (let mins = openMins; mins + serviceDurationMins <= closeMins; mins += slotIntervalMins) {
    candidates.push(minutesToTime(mins))
  }

  // Each booked start time blocks its service window
  const blockedRanges = bookedSlots.map((slot) => ({
    start: timeToMinutes(slot),
    end: timeToMinutes(slot) + serviceDurationMins,
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
