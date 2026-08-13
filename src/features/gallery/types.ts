import type { Timestamp } from 'firebase/firestore'
import type { ServiceCategory } from '../booking/types'

/** Firestore collection for gallery portfolio items. */
export const GALLERY_COLLECTIONS = {
  GALLERY_ITEMS: 'galleryItems',
} as const

/** Gallery categories align with salon services plus a catch-all. */
export type GalleryCategory = ServiceCategory | 'other'

/** Maximum upload size enforced client-side and in Storage rules (5 MB). */
export const GALLERY_MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/** Accepted MIME types for gallery uploads. */
export const GALLERY_ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type GalleryAcceptedMimeType = (typeof GALLERY_ACCEPTED_MIME_TYPES)[number]

/** Canonical Storage object path for a gallery item's primary image. */
export function galleryStoragePath(galleryItemId: string): string {
  return `gallery/${galleryItemId}/original.webp`
}

/** Client-facing gallery item (Timestamps converted to Date). */
export interface GalleryItem {
  galleryItemId: string
  title: string
  description: string
  category: GalleryCategory
  imageUrl: string
  storagePath: string
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
  extends Omit<GalleryItem, 'createdAt' | 'updatedAt' | 'featuredUntil'> {
  createdAt: Timestamp
  updatedAt: Timestamp
  featuredUntil?: Timestamp
}

/** Progress callback for resumable uploads (0–100). */
export type UploadProgressCallback = (percent: number) => void
