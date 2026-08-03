import { useState, useEffect } from 'react'
import { getBookingConfig, getBookedSlots } from '../services/availabilityService'
import { generateAvailableSlots } from '../utils/slotGenerator'
import type { BookingConfig } from '../types'

export interface UseAvailabilityReturn {
  slots: string[]
  config: BookingConfig | null
  configLoading: boolean
  slotsLoading: boolean
  error: string | null
}

export function useAvailability(
  date: string | null,
  serviceDurationMins: number,
): UseAvailabilityReturn {
  const [config, setConfig] = useState<BookingConfig | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [configLoading, setConfigLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load config once on mount — used by the calendar and slot generator
  useEffect(() => {
    let cancelled = false
    getBookingConfig()
      .then((cfg) => {
        if (!cancelled) { setConfig(cfg); setConfigLoading(false) }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load booking configuration')
          setConfigLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  // Reload available slots whenever the date or service duration changes
  useEffect(() => {
    if (!date || !config) { setSlots([]); return }

    let cancelled = false
    setSlotsLoading(true)

    getBookedSlots(date)
      .then((bookedSlots) => {
        if (!cancelled) {
          setSlots(generateAvailableSlots({ date, config, serviceDurationMins, bookedSlots }))
          setSlotsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to check availability')
          setSlotsLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [date, serviceDurationMins, config])

  return { slots, config, configLoading, slotsLoading, error }
}
