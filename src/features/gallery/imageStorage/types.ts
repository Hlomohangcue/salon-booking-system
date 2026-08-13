/** Supported third-party image storage providers for gallery assets. */
export const IMAGE_STORAGE_PROVIDER_CLOUDINARY = 'cloudinary' as const

export type ImageStorageProviderName =
  typeof IMAGE_STORAGE_PROVIDER_CLOUDINARY

export interface ImageUploadInput {
  file: Blob
  galleryItemId: string
  fileName?: string
  contentType?: string
}

export interface ImageUploadResult {
  imageUrl: string
  provider: ImageStorageProviderName
  providerKey: string
  mimeType: string
  fileSizeBytes: number
}

/** Provider-neutral image upload/delete contract for gallery assets. */
export interface ImageStorageService {
  upload(
    input: ImageUploadInput,
    onProgress?: (progress: number) => void,
  ): Promise<ImageUploadResult>

  /**
   * Remove the remote asset. MVP implementations may no-op when provider
   * delete requires server-side credentials (e.g. Cloudinary Admin API).
   */
  delete(providerKey: string): Promise<void>
}
