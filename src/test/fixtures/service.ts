import type { Service } from '../../features/booking/types'

let serviceCounter = 0

/** Build a fully-populated Service with sensible defaults; override per test. */
export function makeService(overrides: Partial<Service> = {}): Service {
  serviceCounter += 1
  return {
    serviceId: `svc-${serviceCounter}`,
    name: 'Haircut',
    description: 'A classic haircut',
    durationMinutes: 30,
    priceFrom: 150,
    isActive: true,
    category: 'hair',
    sortOrder: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}
