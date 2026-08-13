import { db } from '../../../lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  type Timestamp as FirestoreTimestamp,
} from 'firebase/firestore'
import {
  GALLERY_COLLECTIONS,
  galleryProviderKey,
  IMAGE_STORAGE_PROVIDER_CLOUDINARY,
  type GalleryItem,
  type GalleryItemDocument,
  type UploadProgressCallback,
} from '../../gallery/types'
import type { GalleryMetadataOutput } from '../../gallery/galleryValidation'
import { parseFeaturedUntil } from '../../gallery/galleryMetadataHelpers'
import { getImageStorageService } from '../../gallery/imageStorage/getImageStorageService'
import { ImageStorageError } from '../../gallery/imageStorage/imageStorageErrors'

export class GalleryError extends Error {
  readonly code:
    | 'NOT_FOUND'
    | 'UPLOAD_FAILED'
    | 'DELETE_FAILED'
    | 'PERMISSION_DENIED'
    | 'NOT_CONFIGURED'
    | 'UNKNOWN'

  constructor(code: GalleryError['code'], message: string) {
    super(message)
    this.name = 'GalleryError'
    this.code = code
  }
}

export function toGalleryError(error: unknown): GalleryError {
  if (error instanceof GalleryError) return error
  if (error instanceof ImageStorageError) {
    if (error.debugDetail) {
      console.debug('[gallery]', error.code, error.debugDetail)
    }
    const galleryCode = mapImageStorageCodeToGallery(error.code)
    return new GalleryError(galleryCode, error.message)
  }
  const message = error instanceof Error ? error.message : undefined
  const code = (error as { code?: string })?.code
  if (code === 'permission-denied') {
    return new GalleryError(
      'PERMISSION_DENIED',
      'You do not have permission to manage gallery items.',
    )
  }
  return new GalleryError(
    'UNKNOWN',
    message ?? 'Something went wrong while managing the gallery. Please try again.',
  )
}

function mapImageStorageCodeToGallery(
  code: ImageStorageError['code'],
): GalleryError['code'] {
  switch (code) {
    case 'NOT_CONFIGURED':
      return 'NOT_CONFIGURED'
    case 'INVALID_REQUEST':
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
    case 'FILE_TOO_LARGE':
    case 'RATE_LIMITED':
    case 'UPLOAD_CANCELLED':
    case 'NETWORK_ERROR':
    case 'SERVER_ERROR':
    case 'INVALID_RESPONSE':
    case 'UNKNOWN':
      return 'UPLOAD_FAILED'
    default:
      return 'UNKNOWN'
  }
}

function resolveProviderFields(
  id: string,
  data: GalleryItemDocument,
): Pick<GalleryItem, 'provider' | 'providerKey' | 'storagePath'> {
  const providerKey =
    data.providerKey ?? data.storagePath ?? galleryProviderKey(id)
  const provider = data.provider ?? IMAGE_STORAGE_PROVIDER_CLOUDINARY
  return {
    provider,
    providerKey,
    storagePath: providerKey,
  }
}

function fromFirestore(id: string, data: GalleryItemDocument): GalleryItem {
  const providerFields = resolveProviderFields(id, data)
  return {
    galleryItemId: id,
    title: data.title,
    description: data.description ?? '',
    category: data.category,
    imageUrl: data.imageUrl,
    ...providerFields,
    isPublished: data.isPublished,
    displayOrder: data.displayOrder,
    uploadedBy: data.uploadedBy,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    isFeatured: data.isFeatured ?? false,
    featuredUntil: data.featuredUntil?.toDate(),
    mimeType: data.mimeType,
    fileSizeBytes: data.fileSizeBytes,
  }
}

function sortGalleryItems(items: GalleryItem[]): GalleryItem[] {
  return [...items].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  })
}

function featuredUntilField(
  value: string | undefined,
): { featuredUntil: FirestoreTimestamp } | { featuredUntil: null } | Record<string, never> {
  const parsed = parseFeaturedUntil(value)
  if (!parsed) return { featuredUntil: null }
  return { featuredUntil: Timestamp.fromDate(parsed) }
}

/** Fetch all gallery items (admin). */
export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  const snap = await getDocs(collection(db, GALLERY_COLLECTIONS.GALLERY_ITEMS))
  const items = snap.docs.map((d) =>
    fromFirestore(d.id, d.data() as GalleryItemDocument),
  )
  return sortGalleryItems(items)
}

/** Compute the next display order value. */
export async function getNextDisplayOrder(): Promise<number> {
  const items = await getAllGalleryItems()
  if (items.length === 0) return 0
  return Math.max(...items.map((i) => i.displayOrder)) + 1
}

export interface UploadGalleryItemParams {
  file: Blob
  metadata: GalleryMetadataOutput
  uploadedBy: string
  onProgress?: UploadProgressCallback
}

/**
 * Upload image via Cloudinary and create the Firestore gallery document.
 */
export async function uploadGalleryItem(
  params: UploadGalleryItemParams,
): Promise<string> {
  const refDoc = doc(collection(db, GALLERY_COLLECTIONS.GALLERY_ITEMS))
  const galleryItemId = refDoc.id
  const imageStorage = getImageStorageService()

  try {
    const upload = await imageStorage.upload(
      {
        file: params.file,
        galleryItemId,
        contentType: 'image/webp',
        fileName: 'original.webp',
      },
      params.onProgress,
    )

    const featuredFields = params.metadata.isFeatured
      ? featuredUntilField(params.metadata.featuredUntil)
      : { featuredUntil: null }

    await setDoc(refDoc, {
      galleryItemId,
      title: params.metadata.title,
      description: params.metadata.description ?? '',
      category: params.metadata.category,
      imageUrl: upload.imageUrl,
      provider: upload.provider,
      providerKey: upload.providerKey,
      storagePath: upload.providerKey,
      isPublished: params.metadata.isPublished,
      displayOrder: params.metadata.displayOrder,
      uploadedBy: params.uploadedBy,
      isFeatured: params.metadata.isFeatured,
      ...featuredFields,
      mimeType: upload.mimeType,
      fileSizeBytes: upload.fileSizeBytes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return galleryItemId
  } catch (error) {
    throw toGalleryError(error)
  }
}

export interface UpdateGalleryMetadataParams {
  galleryItemId: string
  metadata: GalleryMetadataOutput
}

/** Update gallery metadata without replacing the image. */
export async function updateGalleryMetadata(
  params: UpdateGalleryMetadataParams,
): Promise<void> {
  const refDoc = doc(db, GALLERY_COLLECTIONS.GALLERY_ITEMS, params.galleryItemId)
  const snap = await getDoc(refDoc)
  if (!snap.exists()) {
    throw new GalleryError('NOT_FOUND', 'This gallery item no longer exists.')
  }

  const featuredFields = params.metadata.isFeatured
    ? { isFeatured: true, ...featuredUntilField(params.metadata.featuredUntil) }
    : { isFeatured: false, featuredUntil: null }

  await updateDoc(refDoc, {
    title: params.metadata.title,
    description: params.metadata.description ?? '',
    category: params.metadata.category,
    displayOrder: params.metadata.displayOrder,
    isPublished: params.metadata.isPublished,
    ...featuredFields,
    updatedAt: serverTimestamp(),
  })
}

/** Publish a gallery item. */
export async function publishGalleryItem(galleryItemId: string): Promise<void> {
  await updateDoc(doc(db, GALLERY_COLLECTIONS.GALLERY_ITEMS, galleryItemId), {
    isPublished: true,
    updatedAt: serverTimestamp(),
  })
}

/** Unpublish a gallery item. */
export async function unpublishGalleryItem(galleryItemId: string): Promise<void> {
  await updateDoc(doc(db, GALLERY_COLLECTIONS.GALLERY_ITEMS, galleryItemId), {
    isPublished: false,
    updatedAt: serverTimestamp(),
  })
}

/** Toggle featured flag and optional end date. */
export async function setGalleryFeatured(
  galleryItemId: string,
  isFeatured: boolean,
  featuredUntil?: string,
): Promise<void> {
  const featuredFields = isFeatured
    ? { isFeatured: true, ...featuredUntilField(featuredUntil) }
    : { isFeatured: false, featuredUntil: null }

  await updateDoc(doc(db, GALLERY_COLLECTIONS.GALLERY_ITEMS, galleryItemId), {
    ...featuredFields,
    updatedAt: serverTimestamp(),
  })
}

/** Delete Firestore document (remote image cleanup is best-effort on MVP). */
export async function deleteGalleryItem(galleryItemId: string): Promise<void> {
  const refDoc = doc(db, GALLERY_COLLECTIONS.GALLERY_ITEMS, galleryItemId)
  const snap = await getDoc(refDoc)
  if (!snap.exists()) {
    throw new GalleryError('NOT_FOUND', 'This gallery item no longer exists.')
  }

  const data = snap.data() as GalleryItemDocument
  const providerKey =
    data.providerKey ?? data.storagePath ?? galleryProviderKey(galleryItemId)

  try {
    await getImageStorageService().delete(providerKey)
  } catch {
    // MVP: Cloudinary delete is a no-op without server credentials.
  }

  await deleteDoc(refDoc)
}

/** Replace the image for an existing gallery item. */
export async function replaceGalleryImage(
  galleryItemId: string,
  file: Blob,
  onProgress?: UploadProgressCallback,
): Promise<void> {
  const refDoc = doc(db, GALLERY_COLLECTIONS.GALLERY_ITEMS, galleryItemId)
  const snap = await getDoc(refDoc)
  if (!snap.exists()) {
    throw new GalleryError('NOT_FOUND', 'This gallery item no longer exists.')
  }

  try {
    const upload = await getImageStorageService().upload(
      {
        file,
        galleryItemId,
        contentType: 'image/webp',
        fileName: 'original.webp',
      },
      onProgress,
    )

    await updateDoc(refDoc, {
      imageUrl: upload.imageUrl,
      provider: upload.provider,
      providerKey: upload.providerKey,
      storagePath: upload.providerKey,
      mimeType: upload.mimeType,
      fileSizeBytes: upload.fileSizeBytes,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw toGalleryError(error)
  }
}
