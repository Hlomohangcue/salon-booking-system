import type { Customer, CustomerDocument } from '../../features/booking/types'
import { makeTimestamp } from './booking'

let customerCounter = 0

/** Build a fully-populated Customer with sensible defaults; override per test. */
export function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  customerCounter += 1
  const now = new Date('2026-08-01T00:00:00.000Z')
  return {
    customerId: `+2665200000${customerCounter}`,
    customerName: 'Amara Nkosi',
    phoneNumber: `+2665200000${customerCounter}`,
    email: 'amara@example.com',
    archived: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/** Build a raw CustomerDocument (Timestamp fields) for service tests. */
export function makeCustomerDocument(
  overrides: Partial<CustomerDocument> = {},
): CustomerDocument {
  const base = makeCustomer()
  const now = new Date('2026-08-01T00:00:00.000Z')
  return {
    customerId: base.customerId,
    customerName: base.customerName,
    phoneNumber: base.phoneNumber,
    archived: base.archived,
    createdAt: makeTimestamp(now),
    updatedAt: makeTimestamp(now),
    ...overrides,
  }
}
