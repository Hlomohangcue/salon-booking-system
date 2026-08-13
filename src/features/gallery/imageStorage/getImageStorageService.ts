import { CloudinaryImageStorageProvider } from './cloudinaryImageStorage'
import type { ImageStorageService } from './types'

let cached: ImageStorageService | null = null

/** Returns the configured gallery image storage provider (Cloudinary). */
export function getImageStorageService(): ImageStorageService {
  if (!cached) {
    cached = new CloudinaryImageStorageProvider(
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '',
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '',
    )
  }
  return cached
}

/** Test hook — inject a mock provider. */
export function setImageStorageServiceForTests(service: ImageStorageService | null): void {
  cached = service
}
