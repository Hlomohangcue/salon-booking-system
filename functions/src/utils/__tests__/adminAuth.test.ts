import { describe, it, expect } from 'vitest'
import { HttpsError } from 'firebase-functions/v2/https'
import { assertAdmin } from '../adminAuth'
import { createMockDb, MockFirestore } from '../../test/mockFirestore'

describe('assertAdmin', () => {
  it('allows admin role', async () => {
    const store = new MockFirestore()
    store.getAllDocs().set('users/admin-1', { role: 'admin' })
    const db = createMockDb(store)

    await expect(assertAdmin(db, 'admin-1')).resolves.toBe('admin-1')
  })

  it('allows super_admin role', async () => {
    const store = new MockFirestore()
    store.getAllDocs().set('users/super-1', { role: 'super_admin' })
    const db = createMockDb(store)

    await expect(assertAdmin(db, 'super-1')).resolves.toBe('super-1')
  })

  it('rejects customer role', async () => {
    const store = new MockFirestore()
    store.getAllDocs().set('users/user-1', { role: 'customer' })
    const db = createMockDb(store)

    await expect(assertAdmin(db, 'user-1')).rejects.toMatchObject({
      code: 'permission-denied',
    } satisfies Partial<HttpsError>)
  })

  it('rejects missing uid', async () => {
    const store = new MockFirestore()
    const db = createMockDb(store)

    await expect(assertAdmin(db, undefined)).rejects.toMatchObject({
      code: 'unauthenticated',
    } satisfies Partial<HttpsError>)
  })
})
