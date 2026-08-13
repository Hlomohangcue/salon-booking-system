import type { Timestamp } from 'firebase/firestore'
import type { ServiceCategory } from '../booking/types'
import type { ImageStorageProviderName } from './imageStorage/types'

export {
  IMAGE_STORAGE_PROVIDER_CLOUDINARY,
} from './imageStorage/types'
export {
  galleryProviderKey,
  galleryStoragePath,
} from './imageStorage/galleryProviderKey'

/** Firestore collection for gallery portfolio items. */
export const GALLERY_COLLECTIONS = {
  GALLERY_ITEMS: 'galleryItems',
} as const

/** Gallery categories align with salon services plus a catch-all. */
export type GalleryCategory = ServiceCategory | 'other'

/** Maximum upload size enforced client-side (5 MB). */
export const GALLERY_MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/** Accepted MIME types for gallery uploads. */
export const GALLERY_ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type GalleryAcceptedMimeType = (typeof GALLERY_ACCEPTED_MIME_TYPES)[number]

/** Client-facing gallery item (Timestamps converted to Date). */
export interface GalleryItem {
  galleryItemId: string
  title: string
  description: string
  category: GalleryCategory
  imageUrl: string
  /** @deprecated Legacy field — use providerKey. Populated for backward compatibility. */
  storagePath: string
  provider: ImageStorageProviderName
  providerKey: string
  isPublished: boolean
  displayOrder: number
  uploadedBy: string
  createdAt: Date
  updatedAt: Date
  isFeatured: boolean
  featuredUntil?: Date
  mimeType?: string
  fileSizeBytes?: number
}

/** Raw Firestore document shape. */
export interface GalleryItemDocument
  extends Omit<
    GalleryItem,
    'createdAt' | 'updatedAt' | 'featuredUntil' | 'provider' | 'providerKey' | 'storagePath'
  > {
  createdAt: Timestamp
  updatedAt: Timestamp
  featuredUntil?: Timestamp
  provider?: ImageStorageProviderName
  providerKey?: string
  /** Legacy Firebase Storage path or provider key alias. */
  storagePath?: string
}

/** Progress callback for resumable uploads (0–100). */
export type UploadProgressCallback = (percent: number) => void
