import { vi } from 'vitest'

/**
 * Centralised mock for the `firebase/firestore` module.
 *
 * Provides a lightweight in-memory store and vi.fn() stubs for the functions
 * used across the app's services. Import this module in a test file to apply
 * the mock, then configure behaviour via the exported helpers.
 */

export interface FirestoreDoc {
  id: string
  data: () => Record<string, unknown>
  exists: () => boolean
}

export interface FirestoreSnapshot {
  docs: FirestoreDoc[]
  size: number
  empty: boolean
  forEach: (cb: (doc: FirestoreDoc) => void) => void
  data?: () => Record<string, unknown>
  exists?: () => boolean
  id?: string
}

/** In-memory document store keyed by path. */
const store = new Map<string, Record<string, unknown>>()

/** Reset the store between tests. */
export function resetFirestoreStore(): void {
  store.clear()
}

/** Seed a document at a given path. */
export function seedDoc(path: string, data: Record<string, unknown>): void {
  store.set(path, { ...data })
}

/** Read a document from the store. */
export function readDoc(path: string): Record<string, unknown> | undefined {
  const data = store.get(path)
  return data ? { ...data } : undefined
}

function makeDoc(id: string, data: Record<string, unknown>): FirestoreDoc {
  return {
    id,
    data: () => ({ ...data }),
    exists: () => true,
  }
}

function makeSnapshot(paths: string[]): FirestoreSnapshot {
  const docs = paths
    .filter((p) => store.has(p))
    .map((p) => makeDoc(p.split('/').at(-1) ?? p, store.get(p) as Record<string, unknown>))
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: (cb) => docs.forEach(cb),
  }
}

/** Build a query paths list from a collection name (all docs in that collection). */
function collectionPaths(collectionName: string): string[] {
  return [...store.keys()].filter((p) => p.startsWith(`${collectionName}/`))
}

export const firestoreMock = {
  collection: vi.fn((_db: unknown, path: string) => ({ path })),
  doc: vi.fn((_db: unknown, path: string, id?: string) => ({ path: `${path}/${id ?? ''}` })),
  getDocs: vi.fn(async (q: { path: string }) => {
    const paths = collectionPaths(q.path)
    return makeSnapshot(paths)
  }),
  getDoc: vi.fn(async (ref: { path: string }) => {
    if (store.has(ref.path)) {
      return { ...makeSnapshot([ref.path]).docs[0], exists: () => true } as unknown
    }
    return {
      exists: () => false,
      data: () => undefined,
    }
  }),
  setDoc: vi.fn(async (ref: { path: string }, data: Record<string, unknown>) => {
    store.set(ref.path, { ...data })
  }),
  updateDoc: vi.fn(async (ref: { path: string }, data: Record<string, unknown>) => {
    const existing = store.get(ref.path) ?? {}
    store.set(ref.path, { ...existing, ...data })
  }),
  deleteDoc: vi.fn(async (ref: { path: string }) => {
    store.delete(ref.path)
  }),
  runTransaction: vi.fn(async (_db: unknown, fn: (tx: unknown) => Promise<unknown>) => {
    // Minimal transaction — forwards to the callback with a stub tx.
    const tx = {
      get: async (ref: { path: string }) => {
        if (store.has(ref.path)) {
          return { ...makeSnapshot([ref.path]).docs[0], exists: () => true } as unknown
        }
        return { exists: () => false, data: () => undefined }
      },
      set: (ref: { path: string }, data: Record<string, unknown>) => {
        store.set(ref.path, { ...data })
      },
      update: (ref: { path: string }, data: Record<string, unknown>) => {
        const existing = store.get(ref.path) ?? {}
        store.set(ref.path, { ...existing, ...data })
      },
      delete: (ref: { path: string }) => {
        store.delete(ref.path)
      },
    }
    return fn(tx)
  }),
  query: vi.fn((..._args: unknown[]) => ({ isQuery: true })),
  where: vi.fn((..._args: unknown[]) => ({ isWhere: true })),
  orderBy: vi.fn((..._args: unknown[]) => ({ isOrderBy: true })),
  serverTimestamp: vi.fn(() => ({ toDate: () => new Date(), toMillis: () => Date.now() })),
  Timestamp: {
    fromDate: (d: Date) => ({ toDate: () => d, seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
    now: () => ({ toDate: () => new Date() }),
  },
}

/** Apply the firestore mock. Call inside `vi.mock('firebase/firestore', ...)`. */
export function mockFirebaseFirestore() {
  return firestoreMock
}
