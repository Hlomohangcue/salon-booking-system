import { useState, useEffect } from 'react'
import { getServices } from '../services/availabilityService'
import type { Service } from '../types'

export interface UseServicesReturn {
  services: Service[]
  loading: boolean
  error: string | null
}

export function useServices(): UseServicesReturn {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getServices()
      .then((data) => {
        if (!cancelled) { setServices(data); setLoading(false) }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load services')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  return { services, loading, error }
}
