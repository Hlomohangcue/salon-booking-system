import { galleryProviderKey } from './galleryProviderKey'
import {
  ImageStorageError,
  imageStorageErrorFromHttpStatus,
} from './imageStorageErrors'
import {
  IMAGE_STORAGE_PROVIDER_CLOUDINARY,
  type ImageStorageService,
  type ImageUploadInput,
  type ImageUploadResult,
} from './types'

interface CloudinaryUploadResponse {
  secure_url?: string
  public_id?: string
  bytes?: number
  format?: string
  error?: { message?: string }
}

/**
 * Uploads gallery images to Cloudinary via an unsigned upload preset.
 * Only public configuration (cloud name + preset) is required in the browser.
 */
export class CloudinaryImageStorageProvider implements ImageStorageService {
  private readonly cloudName: string
  private readonly uploadPreset: string

  constructor(cloudName: string, uploadPreset: string) {
    this.cloudName = cloudName
    this.uploadPreset = uploadPreset
  }

  async upload(
    input: ImageUploadInput,
    onProgress?: (progress: number) => void,
  ): Promise<ImageUploadResult> {
    if (!this.cloudName || !this.uploadPreset) {
      throw new ImageStorageError(
        'NOT_CONFIGURED',
        'Gallery uploads are not configured. Set Cloudinary environment variables.',
      )
    }

    const contentType = input.contentType ?? 'image/webp'
    const fileName = input.fileName ?? `${input.galleryItemId}.webp`
    const publicId = galleryProviderKey(input.galleryItemId)

    const formData = new FormData()
    formData.append('file', input.file, fileName)
    formData.append('upload_preset', this.uploadPreset)
    formData.append('public_id', publicId)

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`

    const body = await xhrUpload(url, formData, onProgress)

    let parsed: CloudinaryUploadResponse
    try {
      parsed = JSON.parse(body) as CloudinaryUploadResponse
    } catch {
      throw new ImageStorageError(
        'INVALID_RESPONSE',
        'The image service returned an unexpected response. Please try again.',
        'Failed to parse Cloudinary upload response as JSON.',
      )
    }

    if (!parsed.secure_url || !parsed.public_id) {
      const debugDetail = parsed.error?.message ?? 'Missing secure_url or public_id'
      throw new ImageStorageError(
        'INVALID_RESPONSE',
        'The image service returned an unexpected response. Please try again.',
        debugDetail,
      )
    }

    const mimeType =
      parsed.format != null ? `image/${parsed.format}` : contentType

    return {
      imageUrl: parsed.secure_url,
      provider: IMAGE_STORAGE_PROVIDER_CLOUDINARY,
      providerKey: parsed.public_id,
      mimeType,
      fileSizeBytes: parsed.bytes ?? input.file.size,
    }
  }

  /** MVP: remote delete requires Cloudinary API secret (server-side only). */
  async delete(_providerKey: string): Promise<void> {
    return
  }
}

function reportProgress(
  onProgress: ((progress: number) => void) | undefined,
  lastProgress: { value: number },
  next: number,
): void {
  if (!onProgress) return
  const clamped = Math.max(0, Math.min(100, next))
  if (clamped >= lastProgress.value) {
    lastProgress.value = clamped
    onProgress(clamped)
  }
}

function xhrUpload(
  url: string,
  formData: FormData,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const lastProgress = { value: -1 }
    reportProgress(onProgress, lastProgress, 0)

    xhr.open('POST', url)

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return
      if (event.lengthComputable && event.total > 0) {
        const percent = Math.round((event.loaded / event.total) * 100)
        reportProgress(onProgress, lastProgress, Math.min(percent, 99))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        reportProgress(onProgress, lastProgress, 100)
        resolve(xhr.responseText)
        return
      }

      let debugDetail: string | undefined
      try {
        const err = JSON.parse(xhr.responseText) as CloudinaryUploadResponse
        debugDetail = err.error?.message ?? xhr.responseText.slice(0, 200)
      } catch {
        debugDetail = xhr.responseText.slice(0, 200) || `HTTP ${xhr.status}`
      }

      const error = imageStorageErrorFromHttpStatus(xhr.status, debugDetail)
      if (error.debugDetail) {
        console.debug('[gallery upload]', error.code, error.debugDetail)
      }
      reject(error)
    }

    xhr.onerror = () => {
      reject(
        new ImageStorageError(
          'NETWORK_ERROR',
          'Network error while uploading the image. Please check your connection and try again.',
        ),
      )
    }

    xhr.onabort = () => {
      reject(
        new ImageStorageError(
          'UPLOAD_CANCELLED',
          'Image upload was cancelled.',
        ),
      )
    }

    xhr.send(formData)
  })
}
