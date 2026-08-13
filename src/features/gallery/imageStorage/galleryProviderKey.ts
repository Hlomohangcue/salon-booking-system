/** Cloudinary folder + deterministic public_id for a gallery item image. */
export function galleryProviderKey(galleryItemId: string): string {
  return `makeng-gallery/${galleryItemId}`
}

/** @deprecated Use galleryProviderKey — kept for legacy Firestore documents. */
export function galleryStoragePath(galleryItemId: string): string {
  return galleryProviderKey(galleryItemId)
}
