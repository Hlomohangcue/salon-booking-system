/**
 * In-memory Firestore mock for unit-testing idempotent delivery creation.
 */

type DocData = Record<string, unknown>

export interface DocRef {
  path: string
  id: string
  collection?: (name: string) => {
    doc: (id?: string) => DocRef & DocMethods
  }
}

type DocMethods = {
  get: () => Promise<{ exists: boolean; data: () => DocData | undefined }>
  set: (data: DocData) => Promise<void>
  update: (data: DocData) => Promise<void>
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

  update(ref: DocRef, data: DocData): void {
    const existing = this.writes.get(ref.path) ?? this.docs.get(ref.path) ?? {}
    this.writes.set(ref.path, { ...existing, ...data })
  }

  commit(): void {
    for (const [path, data] of this.writes) {
      this.docs.set(path, data)
    }
  }
}

let autoIdCounter = 0

function nextAutoId(): string {
  autoIdCounter += 1
  return `auto-${autoIdCounter}`
}

export class MockFirestore {
  private readonly docs = new Map<string, DocData>()
  private chain: Promise<unknown> = Promise.resolve()

  private buildDocMethods(path: string): DocMethods {
    const docs = this.docs
    return {
      get: async () => {
        const data = docs.get(path)
        return { exists: data !== undefined, data: () => data }
      },
      set: async (data: DocData) => {
        docs.set(path, data)
      },
      update: async (data: DocData) => {
        const existing = docs.get(path) ?? {}
        docs.set(path, { ...existing, ...data })
      },
    }
  }

  private makeDocRef(prefix: string, id: string): DocRef & DocMethods {
    const path = `${prefix}${id}`
    const methods = this.buildDocMethods(path)
    const ref: DocRef = {
      path,
      id,
      collection: (subName: string) => ({
        doc: (subId?: string) => {
          const docId = subId ?? nextAutoId()
          return this.makeDocRef(`${path}/${subName}/`, docId)
        },
      }),
    }
    return Object.assign(ref, methods)
  }

  collection(name: string) {
    const prefix = `${name}/`
    return {
      doc: (id: string) => this.makeDocRef(prefix, id),
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
          update: (ref: DocRef, data: DocData) => tx.update(ref, data),
        }
        return fn(proxy as unknown as FirebaseFirestore.Transaction)
      }),
  } as unknown as FirebaseFirestore.Firestore
}
