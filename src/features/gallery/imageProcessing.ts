import {
  GALLERY_ACCEPTED_MIME_TYPES,
  GALLERY_MAX_UPLOAD_BYTES,
  type GalleryAcceptedMimeType,
} from './types'

export type ImageValidationCode =
  | 'INVALID_TYPE'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE'

export class ImageValidationError extends Error {
  readonly code: ImageValidationCode

  constructor(code: ImageValidationCode, message: string) {
    super(message)
    this.name = 'ImageValidationError'
    this.code = code
  }
}

/** Validates file type and size before upload. */
export function validateGalleryImageFile(file: File): void {
  if (file.size === 0) {
    throw new ImageValidationError('EMPTY_FILE', 'The selected file is empty.')
  }

  if (file.size > GALLERY_MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(
      'FILE_TOO_LARGE',
      'Image must be 5 MB or smaller.',
    )
  }

  const mime = file.type as GalleryAcceptedMimeType
  if (!GALLERY_ACCEPTED_MIME_TYPES.includes(mime)) {
    throw new ImageValidationError(
      'INVALID_TYPE',
      'Only JPEG, PNG, and WebP images are supported.',
    )
  }
}

const MAX_DIMENSION_PX = 2000
const WEBP_QUALITY = 0.82

/**
 * Resize and compress an image to WebP using the Canvas API.
 * Extension point: swap for a dedicated library if quality requirements change.
 */
export async function compressImageToWebP(file: File): Promise<Blob> {
  validateGalleryImageFile(file)

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Unable to process image.')
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result)
        else reject(new Error('Image compression failed.'))
      },
      'image/webp',
      WEBP_QUALITY,
    )
  })

  if (blob.size > GALLERY_MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(
      'FILE_TOO_LARGE',
      'Compressed image still exceeds 5 MB. Try a smaller source image.',
    )
  }

  return blob
}

/** Creates an object URL for local preview; caller must revoke when done. */
export function createImagePreviewUrl(file: File): string {
  validateGalleryImageFile(file)
  return URL.createObjectURL(file)
}
