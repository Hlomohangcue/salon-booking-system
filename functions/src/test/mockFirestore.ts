/**
 * In-memory Firestore mock for unit-testing idempotent delivery creation.
 */

type DocData = Record<string, unknown>

export interface DocRef {
  path: string
  id: string
}

class Transaction {
  private readonly writes = new Map<string, DocData>()

  constructor(private readonly docs: Map<string, DocData>) {}

  async get(ref: DocRef): Promise<{ exists: boolean; data: () => DocData | undefined }> {
    const data = this.writes.get(ref.path) ?? this.docs.get(ref.path)
    return {
      exists: data !== undefined,
      data: () => data,
    }
  }

  set(ref: DocRef, data: DocData): void {
    this.writes.set(ref.path, data)
  }

  commit(): void {
    for (const [path, data] of this.writes) {
      this.docs.set(path, data)
    }
  }
}

export class MockFirestore {
  private readonly docs = new Map<string, DocData>()
  private chain: Promise<unknown> = Promise.resolve()

  collection(name: string) {
    const prefix = `${name}/`
    const docs = this.docs
    return {
      doc: (id: string): DocRef & {
        get: () => Promise<{ exists: boolean; data: () => DocData | undefined }>
        update: (data: DocData) => Promise<void>
      } => {
        const ref: DocRef = { path: `${prefix}${id}`, id }
        return {
          ...ref,
          get: async () => {
            const data = docs.get(ref.path)
            return { exists: data !== undefined, data: () => data }
          },
          update: async (data: DocData) => {
            const existing = docs.get(ref.path) ?? {}
            docs.set(ref.path, { ...existing, ...data })
          },
        }
      },
    }
  }

  runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    const execute = async (): Promise<T> => {
      const tx = new Transaction(this.docs)
      const result = await fn(tx)
      tx.commit()
      return result
    }

    const next = this.chain.then(execute, execute)
    this.chain = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  getDoc(path: string): DocData | undefined {
    return this.docs.get(path)
  }

  getAllDocs(): Map<string, DocData> {
    return this.docs
  }
}

export function createMockDb(store: MockFirestore): FirebaseFirestore.Firestore {
  return {
    collection: (name: string) => store.collection(name),
    runTransaction: <T>(fn: (tx: FirebaseFirestore.Transaction) => Promise<T>) =>
      store.runTransaction(async (tx) => {
        const proxy = {
          get: (ref: DocRef) => tx.get(ref),
          set: (ref: DocRef, data: DocData) => tx.set(ref, data),
        }
        return fn(proxy as unknown as FirebaseFirestore.Transaction)
      }),
  } as unknown as FirebaseFirestore.Firestore
}
