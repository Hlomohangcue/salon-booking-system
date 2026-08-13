/** Provider-neutral image storage error codes. */
export type ImageStorageErrorCode =
  | 'NOT_CONFIGURED'
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'FILE_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'UPLOAD_CANCELLED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN'

export class ImageStorageError extends Error {
  readonly code: ImageStorageErrorCode
  /** Optional technical detail for console/debug logging — not for UI. */
  readonly debugDetail?: string

  constructor(
    code: ImageStorageErrorCode,
    message: string,
    debugDetail?: string,
  ) {
    super(message)
    this.name = 'ImageStorageError'
    this.code = code
    this.debugDetail = debugDetail
  }
}

const HTTP_STATUS_MESSAGES: Record<number, { code: ImageStorageErrorCode; message: string }> = {
  400: {
    code: 'INVALID_REQUEST',
    message:
      'The image upload request was rejected. Please verify the image and try again.',
  },
  401: {
    code: 'UNAUTHORIZED',
    message: 'The gallery image upload configuration is not authorized.',
  },
  403: {
    code: 'FORBIDDEN',
    message: 'The gallery image upload configuration is not authorized.',
  },
  413: {
    code: 'FILE_TOO_LARGE',
    message: 'The image is too large. Maximum allowed size is 5 MB.',
  },
  429: {
    code: 'RATE_LIMITED',
    message: 'Image uploads are temporarily rate-limited. Please try again later.',
  },
}

/** Maps an HTTP status from an image provider upload to a stable application error. */
export function imageStorageErrorFromHttpStatus(
  status: number,
  debugDetail?: string,
): ImageStorageError {
  const mapped = HTTP_STATUS_MESSAGES[status]
  if (mapped) {
    return new ImageStorageError(mapped.code, mapped.message, debugDetail)
  }
  if (status >= 500) {
    return new ImageStorageError(
      'SERVER_ERROR',
      'The image service is temporarily unavailable. Please try again later.',
      debugDetail,
    )
  }
  return new ImageStorageError(
    'UNKNOWN',
    'Something went wrong while uploading the image. Please try again.',
    debugDetail,
  )
}
