import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  GALLERY_COLLECTIONS,
  type GalleryItem,
  type GalleryItemDocument,
} from './types'

function fromFirestore(data: GalleryItemDocument): GalleryItem {
  return {
    ...data,
    description: data.description ?? '',
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    isFeatured: data.isFeatured ?? false,
    featuredUntil: data.featuredUntil?.toDate(),
  }
}

/** Whether a featured item is currently active. */
export function isFeaturedActive(item: GalleryItem, now = new Date()): boolean {
  if (!item.isFeatured) return false
  if (!item.featuredUntil) return false
  const end = new Date(item.featuredUntil)
  end.setHours(23, 59, 59, 999)
  return now <= end
}

/** Featured with no end date is always active while isFeatured is true. */
export function isFeaturedActiveIncludingOpenEnded(
  item: GalleryItem,
  now = new Date(),
): boolean {
  if (!item.isFeatured) return false
  if (!item.featuredUntil) return true
  return isFeaturedActive(item, now)
}

/**
 * Sort published items: featured (active) first, then displayOrder ASC, then title.
 */
export function sortPublishedGalleryItems(items: GalleryItem[]): GalleryItem[] {
  return [...items].sort((a, b) => {
    const aFeatured = isFeaturedActiveIncludingOpenEnded(a) ? 1 : 0
    const bFeatured = isFeaturedActiveIncludingOpenEnded(b) ? 1 : 0
    if (aFeatured !== bFeatured) return bFeatured - aFeatured
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  })
}

/**
 * Fetch published gallery items for the public site.
 */
export async function getPublishedGalleryItems(
  maxItems?: number,
): Promise<GalleryItem[]> {
  const baseQuery = query(
    collection(db, GALLERY_COLLECTIONS.GALLERY_ITEMS),
    where('isPublished', '==', true),
    orderBy('displayOrder', 'asc'),
    ...(maxItems ? [limit(maxItems)] : []),
  )

  const snap = await getDocs(baseQuery)
  const items = snap.docs.map((d) =>
    fromFirestore({ galleryItemId: d.id, ...d.data() } as GalleryItemDocument),
  )
  return sortPublishedGalleryItems(items)
}

/** Converts raw Firestore document data (for tests). */
export function galleryItemFromFirestoreData(
  data: GalleryItemDocument,
): GalleryItem {
  return fromFirestore(data)
}
