import { describe, it, expect } from 'vitest'
import {
  sortPublishedGalleryItems,
  isFeaturedActiveIncludingOpenEnded,
  galleryItemFromFirestoreData,
} from '../galleryService'
import type { GalleryItem, GalleryItemDocument } from '../types'
import { Timestamp } from 'firebase/firestore'

function makeItem(
  overrides: Partial<GalleryItem> & { galleryItemId: string },
): GalleryItem {
  const now = new Date('2026-08-01')
  return galleryItemFromFirestoreData({
    galleryItemId: overrides.galleryItemId,
    title: overrides.title ?? 'Photo',
    description: '',
    category: overrides.category ?? 'hair',
    imageUrl: 'https://example.com/img.webp',
    storagePath: `gallery/${overrides.galleryItemId}/original.webp`,
    isPublished: overrides.isPublished ?? true,
    displayOrder: overrides.displayOrder ?? 0,
    uploadedBy: 'admin-1',
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
    isFeatured: overrides.isFeatured ?? false,
    featuredUntil: overrides.featuredUntil
      ? Timestamp.fromDate(overrides.featuredUntil)
      : undefined,
  } as GalleryItemDocument)
}

describe('sortPublishedGalleryItems', () => {
  it('sorts featured items before non-featured', () => {
    const items = [
      makeItem({ galleryItemId: 'a', displayOrder: 0, isFeatured: false }),
      makeItem({ galleryItemId: 'b', displayOrder: 1, isFeatured: true }),
    ]
    const sorted = sortPublishedGalleryItems(items)
    expect(sorted[0]?.galleryItemId).toBe('b')
  })

  it('sorts by displayOrder when featured status matches', () => {
    const items = [
      makeItem({ galleryItemId: 'a', displayOrder: 5 }),
      makeItem({ galleryItemId: 'b', displayOrder: 1 }),
    ]
    const sorted = sortPublishedGalleryItems(items)
    expect(sorted.map((i) => i.galleryItemId)).toEqual(['b', 'a'])
  })
})

describe('isFeaturedActiveIncludingOpenEnded', () => {
  it('returns true for featured without end date', () => {
    const item = makeItem({ galleryItemId: 'x', isFeatured: true })
    expect(isFeaturedActiveIncludingOpenEnded(item)).toBe(true)
  })

  it('returns false when featured until date has passed', () => {
    const item = makeItem({
      galleryItemId: 'x',
      isFeatured: true,
      featuredUntil: new Date('2020-01-01'),
    })
    expect(isFeaturedActiveIncludingOpenEnded(item, new Date('2026-01-01'))).toBe(false)
  })
})

describe('galleryMetadataSchema', () => {
  it('validates required title and category', async () => {
    const { galleryMetadataSchema } = await import('../galleryValidation')
    const result = galleryMetadataSchema.safeParse({
      title: 'Silk press',
      category: 'hair',
      displayOrder: 0,
      isPublished: true,
      isFeatured: false,
      featuredUntil: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty title', async () => {
    const { galleryMetadataSchema } = await import('../galleryValidation')
    const result = galleryMetadataSchema.safeParse({
      title: '',
      category: 'hair',
      displayOrder: 0,
      isPublished: false,
      isFeatured: false,
    })
    expect(result.success).toBe(false)
  })
})

describe('validateGalleryImageFile', () => {
  it('rejects oversized files', async () => {
    const { validateGalleryImageFile, ImageValidationError } = await import('../imageProcessing')
    const { GALLERY_MAX_UPLOAD_BYTES } = await import('../types')
    const file = new File([new Uint8Array(GALLERY_MAX_UPLOAD_BYTES + 1)], 'big.jpg', {
      type: 'image/jpeg',
    })
    expect(() => validateGalleryImageFile(file)).toThrow(ImageValidationError)
  })

  it('rejects unsupported MIME types', async () => {
    const { validateGalleryImageFile, ImageValidationError } = await import('../imageProcessing')
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    expect(() => validateGalleryImageFile(file)).toThrow(ImageValidationError)
  })

  it('accepts valid JPEG files', async () => {
    const { validateGalleryImageFile } = await import('../imageProcessing')
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    expect(() => validateGalleryImageFile(file)).not.toThrow()
  })
})

describe('galleryStoragePath', () => {
  it('uses galleryItemId in path', async () => {
    const { galleryStoragePath } = await import('../types')
    expect(galleryStoragePath('abc123')).toBe('gallery/abc123/original.webp')
  })
})
