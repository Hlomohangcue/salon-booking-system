import { db, storage } from '../../../lib/firebase'
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
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import {
  GALLERY_COLLECTIONS,
  galleryStoragePath,
  type GalleryItem,
  type GalleryItemDocument,
  type UploadProgressCallback,
} from '../../gallery/types'
import type { GalleryMetadataOutput } from '../../gallery/galleryValidation'
import { parseFeaturedUntil } from '../../gallery/galleryMetadataHelpers'

export class GalleryError extends Error {
  readonly code:
    | 'NOT_FOUND'
    | 'UPLOAD_FAILED'
    | 'DELETE_FAILED'
    | 'PERMISSION_DENIED'
    | 'UNKNOWN'

  constructor(code: GalleryError['code'], message: string) {
    super(message)
    this.name = 'GalleryError'
    this.code = code
  }
}

export function toGalleryError(error: unknown): GalleryError {
  if (error instanceof GalleryError) return error
  const message = error instanceof Error ? error.message : undefined
  const code = (error as { code?: string })?.code
  if (code === 'storage/unauthorized' || code === 'permission-denied') {
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

function fromFirestore(id: string, data: GalleryItemDocument): GalleryItem {
  return {
    galleryItemId: id,
    title: data.title,
    description: data.description ?? '',
    category: data.category,
    imageUrl: data.imageUrl,
    storagePath: data.storagePath,
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
 * Upload image to Storage and create the Firestore gallery document.
 */
export async function uploadGalleryItem(
  params: UploadGalleryItemParams,
): Promise<string> {
  const refDoc = doc(collection(db, GALLERY_COLLECTIONS.GALLERY_ITEMS))
  const galleryItemId = refDoc.id
  const storagePath = galleryStoragePath(galleryItemId)
  const storageRef = ref(storage, storagePath)

  try {
    await uploadBlobWithProgress(storageRef, params.file, params.onProgress)
    const imageUrl = await getDownloadURL(storageRef)

    const featuredFields = params.metadata.isFeatured
      ? featuredUntilField(params.metadata.featuredUntil)
      : { featuredUntil: null }

    await setDoc(refDoc, {
      galleryItemId,
      title: params.metadata.title,
      description: params.metadata.description ?? '',
      category: params.metadata.category,
      imageUrl,
      storagePath,
      isPublished: params.metadata.isPublished,
      displayOrder: params.metadata.displayOrder,
      uploadedBy: params.uploadedBy,
      isFeatured: params.metadata.isFeatured,
      ...featuredFields,
      mimeType: 'image/webp',
      fileSizeBytes: params.file.size,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return galleryItemId
  } catch (error) {
    try {
      await deleteObject(storageRef)
    } catch {
      // Best-effort cleanup
    }
    throw toGalleryError(error)
  }
}

function uploadBlobWithProgress(
  storageRef: ReturnType<typeof ref>,
  file: Blob,
  onProgress?: UploadProgressCallback,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: 'image/webp',
    })
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          )
          onProgress(percent)
        }
      },
      (error) => reject(error),
      () => resolve(),
    )
  })
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

/** Delete Firestore document and Storage object. */
export async function deleteGalleryItem(galleryItemId: string): Promise<void> {
  const refDoc = doc(db, GALLERY_COLLECTIONS.GALLERY_ITEMS, galleryItemId)
  const snap = await getDoc(refDoc)
  if (!snap.exists()) {
    throw new GalleryError('NOT_FOUND', 'This gallery item no longer exists.')
  }

  const data = snap.data() as GalleryItemDocument
  const storagePath = data.storagePath || galleryStoragePath(galleryItemId)

  try {
    await deleteObject(ref(storage, storagePath))
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (code !== 'storage/object-not-found') {
      throw new GalleryError(
        'DELETE_FAILED',
        'Unable to delete the image file. Please try again.',
      )
    }
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

  const existing = snap.data() as GalleryItemDocument
  const storagePath = galleryStoragePath(galleryItemId)
  const storageRef = ref(storage, storagePath)

  await uploadBlobWithProgress(storageRef, file, onProgress)
  const imageUrl = await getDownloadURL(storageRef)

  if (existing.storagePath && existing.storagePath !== storagePath) {
    try {
      await deleteObject(ref(storage, existing.storagePath))
    } catch {
      // Non-fatal
    }
  }

  await updateDoc(refDoc, {
    imageUrl,
    storagePath,
    mimeType: 'image/webp',
    fileSizeBytes: file.size,
    updatedAt: serverTimestamp(),
  })
}
