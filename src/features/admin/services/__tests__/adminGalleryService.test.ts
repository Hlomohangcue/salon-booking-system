import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  uploadGalleryItem,
  replaceGalleryImage,
  deleteGalleryItem,
  toGalleryError,
  GalleryError,
} from '../adminGalleryService'
import { ImageStorageError } from '../../../gallery/imageStorage/imageStorageErrors'
import {
  IMAGE_STORAGE_PROVIDER_CLOUDINARY,
  GALLERY_COLLECTIONS,
} from '../../../gallery/types'

const firestoreStore = new Map<string, Record<string, unknown>>()
let generatedDocCounter = 0

const mockUpload = vi.fn()
const mockDelete = vi.fn()

vi.mock('../../../../lib/firebase', () => ({ db: { _mock: true } }))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ collectionName: name })),
  doc: vi.fn((refOrDb: unknown, second?: string, third?: string) => {
    if (
      refOrDb &&
      typeof refOrDb === 'object' &&
      'collectionName' in refOrDb &&
      !third
    ) {
      generatedDocCounter += 1
      const id = `gen-${generatedDocCounter}`
      const collectionName = (refOrDb as { collectionName: string }).collectionName
      return { path: `${collectionName}/${id}`, id }
    }
    if (second && third) {
      return { path: `${second}/${third}`, id: third }
    }
    return { path: 'unknown/unknown', id: 'unknown' }
  }),
  getDoc: vi.fn(async (ref: { path: string }) => {
    const data = firestoreStore.get(ref.path)
    if (!data) {
      return { exists: () => false, data: () => undefined }
    }
    return { exists: () => true, data: () => ({ ...data }) }
  }),
  getDocs: vi.fn(async () => ({ docs: [] })),
  setDoc: vi.fn(async (ref: { path: string }, data: Record<string, unknown>) => {
    firestoreStore.set(ref.path, { ...data })
  }),
  updateDoc: vi.fn(async (ref: { path: string }, data: Record<string, unknown>) => {
    const existing = firestoreStore.get(ref.path) ?? {}
    firestoreStore.set(ref.path, { ...existing, ...data })
  }),
  deleteDoc: vi.fn(async (ref: { path: string }) => {
    firestoreStore.delete(ref.path)
  }),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  Timestamp: {
    fromDate: (d: Date) => ({ toDate: () => d }),
  },
}))

vi.mock('../../../gallery/imageStorage/getImageStorageService', () => ({
  getImageStorageService: () => ({
    upload: mockUpload,
    delete: mockDelete,
  }),
}))

const sampleMetadata = {
  title: 'Silk press',
  description: '',
  category: 'hair' as const,
  displayOrder: 0,
  isPublished: false,
  isFeatured: false,
  featuredUntil: '',
}

const sampleUploadResult = {
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/makeng-gallery/gen-1.webp',
  provider: IMAGE_STORAGE_PROVIDER_CLOUDINARY,
  providerKey: 'makeng-gallery/gen-1',
  mimeType: 'image/webp',
  fileSizeBytes: 512,
}

describe('adminGalleryService orchestration', () => {
  beforeEach(() => {
    firestoreStore.clear()
    generatedDocCounter = 0
    mockUpload.mockReset()
    mockDelete.mockReset()
    mockDelete.mockResolvedValue(undefined)
    mockUpload.mockResolvedValue(sampleUploadResult)
  })

  describe('CREATE', () => {
    it('uploads then creates Firestore document with provider fields', async () => {
      const id = await uploadGalleryItem({
        file: new Blob(['x'], { type: 'image/webp' }),
        metadata: sampleMetadata,
        uploadedBy: 'admin-1',
      })

      expect(id).toBe('gen-1')
      expect(mockUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          galleryItemId: 'gen-1',
          contentType: 'image/webp',
        }),
        undefined,
      )

      const stored = firestoreStore.get(`${GALLERY_COLLECTIONS.GALLERY_ITEMS}/gen-1`)
      expect(stored).toMatchObject({
        galleryItemId: 'gen-1',
        imageUrl: sampleUploadResult.imageUrl,
        provider: 'cloudinary',
        providerKey: 'makeng-gallery/gen-1',
        storagePath: 'makeng-gallery/gen-1',
        title: 'Silk press',
        uploadedBy: 'admin-1',
      })
    })
  })

  describe('CLOUDINARY UPLOAD FAILURE', () => {
    it('does not create a Firestore document when upload fails', async () => {
      mockUpload.mockRejectedValue(
        new ImageStorageError('NETWORK_ERROR', 'Network error while uploading the image. Please check your connection and try again.'),
      )

      await expect(
        uploadGalleryItem({
          file: new Blob(['x']),
          metadata: sampleMetadata,
          uploadedBy: 'admin-1',
        }),
      ).rejects.toBeInstanceOf(GalleryError)

      expect(firestoreStore.size).toBe(0)
    })
  })

  describe('FIRESTORE CREATE FAILURE AFTER UPLOAD SUCCESS', () => {
    it('surfaces failure without claiming remote cleanup occurred', async () => {
      const { setDoc } = await import('firebase/firestore')
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('Firestore write failed'))

      await expect(
        uploadGalleryItem({
          file: new Blob(['x']),
          metadata: sampleMetadata,
          uploadedBy: 'admin-1',
        }),
      ).rejects.toBeInstanceOf(GalleryError)

      expect(mockUpload).toHaveBeenCalledTimes(1)
      expect(firestoreStore.size).toBe(0)
      expect(mockDelete).not.toHaveBeenCalled()
    })
  })

  describe('REPLACE IMAGE', () => {
    it('updates Firestore after successful replacement upload', async () => {
      const path = `${GALLERY_COLLECTIONS.GALLERY_ITEMS}/item-1`
      firestoreStore.set(path, {
        galleryItemId: 'item-1',
        imageUrl: 'https://old.example/image.webp',
        provider: 'cloudinary',
        providerKey: 'makeng-gallery/item-1',
        storagePath: 'makeng-gallery/item-1',
      })

      mockUpload.mockResolvedValueOnce({
        ...sampleUploadResult,
        imageUrl: 'https://res.cloudinary.com/demo/new.webp',
        providerKey: 'makeng-gallery/item-1',
      })

      await replaceGalleryImage('item-1', new Blob(['y'], { type: 'image/webp' }))

      expect(mockUpload).toHaveBeenCalledWith(
        expect.objectContaining({ galleryItemId: 'item-1' }),
        undefined,
      )

      expect(firestoreStore.get(path)).toMatchObject({
        imageUrl: 'https://res.cloudinary.com/demo/new.webp',
        providerKey: 'makeng-gallery/item-1',
        storagePath: 'makeng-gallery/item-1',
      })
    })
  })

  describe('REPLACE FAILURE', () => {
    it('leaves existing Firestore document unchanged when upload fails', async () => {
      const path = `${GALLERY_COLLECTIONS.GALLERY_ITEMS}/item-1`
      const original = {
        galleryItemId: 'item-1',
        imageUrl: 'https://old.example/image.webp',
        provider: 'cloudinary',
        providerKey: 'makeng-gallery/item-1',
        storagePath: 'makeng-gallery/item-1',
      }
      firestoreStore.set(path, original)

      mockUpload.mockRejectedValueOnce(
        new ImageStorageError('SERVER_ERROR', 'The image service is temporarily unavailable. Please try again later.'),
      )

      await expect(
        replaceGalleryImage('item-1', new Blob(['y'])),
      ).rejects.toMatchObject({ code: 'UPLOAD_FAILED' })

      expect(firestoreStore.get(path)).toEqual(original)
    })
  })

  describe('DELETE', () => {
    it('calls provider delete and removes Firestore document (MVP no-op delete)', async () => {
      const path = `${GALLERY_COLLECTIONS.GALLERY_ITEMS}/item-1`
      firestoreStore.set(path, {
        galleryItemId: 'item-1',
        providerKey: 'makeng-gallery/item-1',
        storagePath: 'makeng-gallery/item-1',
      })

      await deleteGalleryItem('item-1')

      expect(mockDelete).toHaveBeenCalledWith('makeng-gallery/item-1')
      expect(firestoreStore.has(path)).toBe(false)
    })
  })
})

describe('toGalleryError', () => {
  it('maps ImageStorageError without exposing debugDetail in message', () => {
    const err = toGalleryError(
      new ImageStorageError(
        'INVALID_REQUEST',
        'The image upload request was rejected. Please verify the image and try again.',
        'raw provider detail',
      ),
    )
    expect(err).toMatchObject({ code: 'UPLOAD_FAILED' })
    expect(err.message).not.toContain('raw provider detail')
  })

  it('maps NOT_CONFIGURED from ImageStorageError', () => {
    const err = toGalleryError(
      new ImageStorageError('NOT_CONFIGURED', 'Gallery uploads are not configured.'),
    )
    expect(err.code).toBe('NOT_CONFIGURED')
  })
})
