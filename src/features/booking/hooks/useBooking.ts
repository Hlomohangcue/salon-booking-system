import { useState, useCallback } from 'react'
import type { Service } from '../types'
import type { BookingDetailsOutput } from '../utils/bookingValidation'

export interface WizardData {
  serviceId: string
  serviceName: string
  serviceDuration: number
  priceFrom: number
  preferredDate: string
  preferredTime: string
  customerName: string
  phoneNumber: string   // E.164 normalised (from Zod transform output)
  email: string
  notes: string
}

const TOTAL_STEPS = 6  // steps 0–5; step 5 = success

export function useBooking() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Partial<WizardData>>({})

  const canGoNext = (() => {
    switch (step) {
      case 0: return Boolean(data.serviceId)
      case 1: return Boolean(data.preferredDate)
      case 2: return Boolean(data.preferredTime)
      case 3: return Boolean(data.customerName && data.phoneNumber)
      default: return true
    }
  })()

  const goNext = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
  }, [])

  const goBack = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const selectService = useCallback((service: Service) => {
    setData((prev) => ({
      ...prev,
      serviceId: service.serviceId,
      serviceName: service.name,
      serviceDuration: service.durationMinutes,
      priceFrom: service.priceFrom,
      // Clear downstream selections when service changes
      preferredDate: undefined,
      preferredTime: undefined,
    }))
  }, [])

  const selectDate = useCallback((date: string) => {
    setData((prev) => ({ ...prev, preferredDate: date, preferredTime: undefined }))
  }, [])

  const selectTime = useCallback((time: string) => {
    setData((prev) => ({ ...prev, preferredTime: time }))
  }, [])

  const setDetails = useCallback((details: BookingDetailsOutput) => {
    setData((prev) => ({
      ...prev,
      customerName: details.customerName,
      phoneNumber: details.phoneNumber,
      email: details.email ?? '',
      notes: details.notes ?? '',
    }))
  }, [])

  const reset = useCallback(() => {
    setStep(0)
    setData({})
  }, [])

  return { step, data, canGoNext, goNext, goBack, selectService, selectDate, selectTime, setDetails, reset }
}
