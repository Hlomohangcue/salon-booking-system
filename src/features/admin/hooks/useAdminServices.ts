import { useCallback, useMemo, useState } from 'react'
import type { Service } from '../../booking/types'
import {
  getServices,
  createService,
  updateService,
  archiveService,
  restoreService,
  deleteService,
  getServiceUsageCount,
  toServiceError,
  ServiceError,
  type CreateServicePayload,
  type UpdateServicePayload,
} from '../services/adminServiceService'

/** Sort services by sortOrder ASC, then name ASC (mirrors the service layer). */
function sortServices(services: Service[]): Service[] {
  return [...services].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

export interface UseAdminServicesReturn {
  /** All services (active + archived), sorted by sortOrder ASC then name ASC. */
  services: Service[]
  loading: boolean
  /** Human-readable load error, or null when idle/success. */
  error: string | null
  /** Re-fetch all services from Firestore. */
  refresh: () => Promise<void>
  /** Whether a mutation is currently in flight (disables action buttons). */
  mutating: boolean
  /** Mutation error message scoped to the last action. */
  mutationError: string | null
  /** Human-readable success message from the last action, cleared on next action. */
  successMessage: string | null
  /** Create a new service. Returns the new Firestore document ID. */
  createServiceAction: (payload: CreateServicePayload) => Promise<string>
  /** Update an existing service. */
  updateServiceAction: (serviceId: string, payload: UpdateServicePayload) => Promise<void>
  /** Archive a service (isActive = false). */
  archiveServiceAction: (serviceId: string) => Promise<void>
  /** Restore a previously archived service (isActive = true). */
  restoreServiceAction: (serviceId: string) => Promise<void>
  /** Delete a service after confirming it has no historical bookings. */
  deleteServiceAction: (serviceId: string) => Promise<void>
  /** Count bookings referencing a service (guards destructive deletes). */
  getUsageCount: (serviceId: string) => Promise<number>
}

/**
 * Loads all services from Firestore and exposes explicit mutation actions.
 *
 * Mutations update local state optimistically after a successful write so the
 * table reflects changes immediately; a full `refresh()` only happens if the
 * optimistic sync fails. All business logic lives in the service layer.
 */
export function useAdminServices(): UseAdminServicesReturn {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getServices()
      setServices(data)
    } catch (err: unknown) {
      const serviceError: ServiceError = toServiceError(err)
      setError(serviceError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const runMutation = useCallback(
    async <T,>(action: () => Promise<T>, success: string): Promise<T> => {
      setMutating(true)
      setMutationError(null)
      setSuccessMessage(null)
      try {
        const result = await action()
        setSuccessMessage(success)
        return result
      } catch (err: unknown) {
        const serviceError: ServiceError = toServiceError(err)
        setMutationError(serviceError.message)
        throw serviceError
      } finally {
        setMutating(false)
      }
    },
    [],
  )

  const createServiceAction = useCallback(
    (payload: CreateServicePayload): Promise<string> =>
      runMutation(async () => {
        const id = await createService(payload)
        // Re-fetch to pick up the server-generated createdAt/sort position.
        const data = await getServices()
        setServices(data)
        return id
      }, 'Service created successfully'),
    [runMutation],
  )

  const updateServiceAction = useCallback(
    (serviceId: string, payload: UpdateServicePayload): Promise<void> =>
      runMutation(async () => {
        await updateService(serviceId, payload)
        // Optimistically sync the edited service into local state.
        setServices((prev) => {
          const updated = prev.map((s) =>
            s.serviceId === serviceId
              ? {
                  ...s,
                  name: payload.name,
                  category: payload.category,
                  durationMinutes: payload.durationMinutes,
                  priceFrom: payload.priceFrom,
                  description: payload.description ?? '',
                  sortOrder: payload.sortOrder,
                  isActive: payload.isActive,
                  updatedAt: new Date(),
                }
              : s,
          )
          return sortServices(updated)
        })
      }, 'Service updated successfully'),
    [runMutation],
  )

  const archiveServiceAction = useCallback(
    (serviceId: string): Promise<void> =>
      runMutation(async () => {
        await archiveService(serviceId)
        setServices((prev) =>
          prev.map((s) =>
            s.serviceId === serviceId
              ? { ...s, isActive: false, updatedAt: new Date() }
              : s,
          ),
        )
      }, 'Service archived. It is no longer shown to customers.'),
    [runMutation],
  )

  const restoreServiceAction = useCallback(
    (serviceId: string): Promise<void> =>
      runMutation(async () => {
        await restoreService(serviceId)
        setServices((prev) =>
          prev.map((s) =>
            s.serviceId === serviceId
              ? { ...s, isActive: true, updatedAt: new Date() }
              : s,
          ),
        )
      }, 'Service restored and visible to customers again.'),
    [runMutation],
  )

  const deleteServiceAction = useCallback(
    (serviceId: string): Promise<void> =>
      runMutation(async () => {
        // The UI blocks delete when usage > 0, but the service enforces it too.
        const usage = await getServiceUsageCount(serviceId)
        if (usage > 0) {
          throw new ServiceError(
            'IN_USE',
            'This service is referenced by bookings and cannot be deleted. Archive it instead to preserve history.',
          )
        }
        await deleteService(serviceId)
        setServices((prev) => prev.filter((s) => s.serviceId !== serviceId))
      }, 'Service deleted successfully'),
    [runMutation],
  )

  const getUsageCount = useCallback(
    (serviceId: string): Promise<number> => getServiceUsageCount(serviceId),
    [],
  )

  return useMemo(
    () => ({
      services,
      loading,
      error,
      refresh,
      mutating,
      mutationError,
      successMessage,
      createServiceAction,
      updateServiceAction,
      archiveServiceAction,
      restoreServiceAction,
      deleteServiceAction,
      getUsageCount,
    }),
    [
      services,
      loading,
      error,
      refresh,
      mutating,
      mutationError,
      successMessage,
      createServiceAction,
      updateServiceAction,
      archiveServiceAction,
      restoreServiceAction,
      deleteServiceAction,
      getUsageCount,
    ],
  )
}

