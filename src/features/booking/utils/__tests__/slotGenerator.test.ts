import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { generateAvailableSlots, generateAllSlots } from '../slotGenerator'
import { makeBookingConfig } from '../../../../test/fixtures/booking'

// Fixed "today" — Wednesday 2026-08-05 08:00 local. With minAdvanceHours 0,
// every slot on that day is in advance and within the booking window.
const NOW = new Date(2026, 7, 5, 8, 0, 0, 0)

describe('generateAvailableSlots', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates a full grid of 30-min slots for a normal open day', () => {
    const config = makeBookingConfig({ minAdvanceHours: 0 })
    const slots = generateAvailableSlots({
      date: '2026-08-05',
      config,
      serviceDurationMins: 30,
      bookedSlots: [],
    })
    // 09:00 -> 16:30 (17:00 close, 30-min service) => 16 slots
    expect(slots).toHaveLength(16)
    expect(slots[0]).toBe('09:00')
    expect(slots[slots.length - 1]).toBe('16:30')
  })

  it('returns [] when the date is outside the booking window', () => {
    const config = makeBookingConfig({ bookingWindowDays: 1 })
    const slots = generateAvailableSlots({
      date: '2026-09-01', // far beyond window
      config,
      serviceDurationMins: 30,
      bookedSlots: [],
    })
    expect(slots).toEqual([])
  })

  it('returns [] when the day is closed', () => {
    const config = makeBookingConfig({
      openingHours: {
        ...makeBookingConfig().openingHours,
        mon: { open: '09:00', close: '17:00', closed: true },
      },
    })
    const slots = generateAvailableSlots({
      date: '2026-08-03', // Monday
      config,
      serviceDurationMins: 30,
      bookedSlots: [],
    })
    expect(slots).toEqual([])
  })

  it('returns [] on a holiday', () => {
    const config = makeBookingConfig({ holidays: ['2026-08-05'] })
    const slots = generateAvailableSlots({
      date: '2026-08-05',
      config,
      serviceDurationMins: 30,
      bookedSlots: [],
    })
    expect(slots).toEqual([])
  })

  it('returns [] when the day exceeds maxBookingsPerDay', () => {
    const config = makeBookingConfig({ maxBookingsPerDay: 2 })
    const slots = generateAvailableSlots({
      date: '2026-08-05',
      config,
      serviceDurationMins: 30,
      bookedSlots: ['09:00', '09:30'],
    })
    expect(slots).toEqual([])
  })

it('returns no slots same-day when the salon opens before the cutoff', () => {
    // Today is 2026-08-05. Cutoff at 12:00 with a 09:00 open => no slots.
    const config = makeBookingConfig({ sameDayCutoffTime: '12:00' })
    const slots = generateAvailableSlots({
      date: '2026-08-05',
      config,
      serviceDurationMins: 30,
      bookedSlots: [],
    })
    expect(slots).toEqual([])
  })

  it('keeps same-day slots when the salon opens at or after the cutoff', () => {
    // Opening at 13:00 with a 12:00 cutoff keeps the afternoon grid.
    const config = makeBookingConfig({
      sameDayCutoffTime: '12:00',
      maxBookingsPerDay: undefined,
      openingHours: {
        ...makeBookingConfig().openingHours,
        wed: { open: '13:00', close: '17:00' },
      },
    })
    const slots = generateAvailableSlots({
      date: '2026-08-05', // Wednesday
      config,
      serviceDurationMins: 30,
      bookedSlots: [],
    })
    expect(slots).toHaveLength(8)
    expect(slots[0]).toBe('13:00')
  })

  it('does not apply same-day cutoff on a different day', () => {
    const config = makeBookingConfig({ sameDayCutoffTime: '12:00' })
    const slots = generateAvailableSlots({
      date: '2026-08-06', // tomorrow, not today
      config,
      serviceDurationMins: 30,
      bookedSlots: [],
    })
    expect(slots).toHaveLength(16)
  })

  it('widens blocked ranges by the inter-appointment buffer', () => {
    // A 30-min booking at 09:00 with a 30-min buffer blocks 09:00-10:00,
    // so 09:30 (which starts inside the buffer) is excluded.
    const config = makeBookingConfig({ bufferBetweenAppointmentsMins: 30 })
    const slots = generateAvailableSlots({
      date: '2026-08-05',
      config,
      serviceDurationMins: 30,
      bookedSlots: ['09:00'],
    })
    expect(slots).not.toContain('09:00')
    expect(slots).not.toContain('09:30')
    expect(slots).toContain('10:00')
  })

it('excludes slots that overlap an existing booking', () => {
    const config = makeBookingConfig()
    const slots = generateAvailableSlots({
      date: '2026-08-05',
      config,
      serviceDurationMins: 30,
      bookedSlots: ['10:00'],
    })
    // 10:00 booked (blocks 10:00-10:30). 09:30 ends exactly at 10:00 so it is
    // allowed; 10:00 itself overlaps and is excluded.
    expect(slots).toContain('09:30')
    expect(slots).not.toContain('10:00')
    expect(slots).toContain('10:30')
  })

  it('excludes slots that are not in advance', () => {
    // minAdvanceHours 24 means nothing today is bookable.
    const config = makeBookingConfig({ minAdvanceHours: 24 })
    const slots = generateAvailableSlots({
      date: '2026-08-05',
      config,
      serviceDurationMins: 30,
      bookedSlots: [],
    })
    expect(slots).toEqual([])
  })

  it('handles an empty booking list', () => {
    const config = makeBookingConfig()
    const slots = generateAvailableSlots({
      date: '2026-08-05',
      config,
      serviceDurationMins: 30,
      bookedSlots: [],
    })
    expect(slots).toHaveLength(16)
  })

it('blocks a fully booked day', () => {
    const config = makeBookingConfig()
    // Book every half-hour slot so no window remains free.
    const allTimes = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    ]
    const slots = generateAvailableSlots({
      date: '2026-08-05',
      config,
      serviceDurationMins: 30,
      bookedSlots: allTimes,
    })
    expect(slots).toEqual([])
  })

  it('respects service duration when generating the grid', () => {
    const config = makeBookingConfig()
    // 60-min service: slots start 09:00..15:00 (last start 15:00, ends 16:00)
    const slots = generateAvailableSlots({
      date: '2026-08-05',
      config,
      serviceDurationMins: 60,
      bookedSlots: [],
    })
    expect(slots[0]).toBe('09:00')
    expect(slots[slots.length - 1]).toBe('16:00')
    expect(slots).toHaveLength(15)
  })
})

describe('generateAllSlots', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates all candidate slots for a day without filtering', () => {
    const config = makeBookingConfig()
    const slots = generateAllSlots('2026-08-05', config)
    // 09:00..16:30 every 30 min => 16 slots
    expect(slots).toHaveLength(16)
    expect(slots[0]).toBe('09:00')
    expect(slots[slots.length - 1]).toBe('16:30')
  })

  it('returns [] for a closed day', () => {
    const config = makeBookingConfig({
      openingHours: { ...makeBookingConfig().openingHours, sun: { open: '09:00', close: '13:00', closed: true } },
    })
    expect(generateAllSlots('2026-08-09', config)).toEqual([])
  })

  it('returns [] on a holiday', () => {
    const config = makeBookingConfig({ holidays: ['2026-08-05'] })
    expect(generateAllSlots('2026-08-05', config)).toEqual([])
  })
})
