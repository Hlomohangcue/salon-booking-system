import { describe, it, expect, vi, afterEach } from 'vitest'
import { CloudinaryImageStorageProvider } from '../cloudinaryImageStorage'
import { ImageStorageError } from '../imageStorageErrors'

type MockXhrInstance = {
  upload: { onprogress: ((e: ProgressEvent) => void) | null }
  onload: (() => void) | null
  onerror: (() => void) | null
  onabort: (() => void) | null
  status: number
  responseText: string
  open: ReturnType<typeof vi.fn>
  send: ReturnType<typeof vi.fn>
  abort: ReturnType<typeof vi.fn>
}

function successResponse(publicId = 'makeng-gallery/item-1') {
  return JSON.stringify({
    secure_url: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.webp`,
    public_id: publicId,
    bytes: 1024,
    format: 'webp',
  })
}

function installMockXhr(options: {
  status?: number
  responseText?: string
  onSend?: (xhr: MockXhrInstance) => void
} = {}) {
  const instances: MockXhrInstance[] = []

  vi.stubGlobal(
    'XMLHttpRequest',
    vi.fn(function MockXHR(this: MockXhrInstance) {
      this.upload = { onprogress: null }
      this.onload = null
      this.onerror = null
      this.onabort = null
      this.status = options.status ?? 200
      this.responseText = options.responseText ?? successResponse()
      this.open = vi.fn()
      this.abort = vi.fn()
      this.send = vi.fn(() => {
        if (options.onSend) {
          options.onSend(this)
          return
        }
        this.onload?.()
      })
      instances.push(this)
    }),
  )

  return instances
}

describe('CloudinaryImageStorageProvider', () => {
  const originalXHR = globalThis.XMLHttpRequest

  afterEach(() => {
    vi.stubGlobal('XMLHttpRequest', originalXHR)
  })

  it('uploads with correct endpoint, preset, cloud name, file, and public_id', async () => {
    const instances = installMockXhr()
    const provider = new CloudinaryImageStorageProvider('demo-cloud', 'unsigned_preset')
    const file = new Blob(['x'], { type: 'image/webp' })

    const result = await provider.upload({
      file,
      galleryItemId: 'item-1',
      contentType: 'image/webp',
    })

    const xhr = instances[0]
    expect(xhr?.open).toHaveBeenCalledWith(
      'POST',
      'https://api.cloudinary.com/v1_1/demo-cloud/image/upload',
    )
    expect(xhr?.send).toHaveBeenCalledTimes(1)

    const formData = xhr?.send.mock.calls[0]?.[0] as FormData
    expect(formData.get('upload_preset')).toBe('unsigned_preset')
    expect(formData.get('public_id')).toBe('makeng-gallery/item-1')
    expect(formData.get('file')).toBeInstanceOf(Blob)

    expect(result.imageUrl).toContain('cloudinary.com')
    expect(result.provider).toBe('cloudinary')
    expect(result.providerKey).toBe('makeng-gallery/item-1')
    expect(result.mimeType).toBe('image/webp')
    expect(result.fileSizeBytes).toBe(1024)
  })

  it('throws NOT_CONFIGURED when cloud name is missing', async () => {
    installMockXhr()
    const provider = new CloudinaryImageStorageProvider('', 'preset')
    await expect(
      provider.upload({ file: new Blob(['x']), galleryItemId: 'a' }),
    ).rejects.toMatchObject({ code: 'NOT_CONFIGURED' } satisfies Partial<ImageStorageError>)
  })

  it('throws NOT_CONFIGURED when upload preset is missing', async () => {
    installMockXhr()
    const provider = new CloudinaryImageStorageProvider('demo', '')
    await expect(
      provider.upload({ file: new Blob(['x']), galleryItemId: 'a' }),
    ).rejects.toMatchObject({ code: 'NOT_CONFIGURED' } satisfies Partial<ImageStorageError>)
  })

  it.each([
    [400, 'INVALID_REQUEST'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [413, 'FILE_TOO_LARGE'],
    [429, 'RATE_LIMITED'],
  ] as const)('maps HTTP %i to %s', async (status, code) => {
    installMockXhr({
      status,
      responseText: JSON.stringify({ error: { message: 'provider internal detail' } }),
    })
    const provider = new CloudinaryImageStorageProvider('demo', 'preset')

    await expect(
      provider.upload({ file: new Blob(['x']), galleryItemId: 'a' }),
    ).rejects.toMatchObject({
      code,
      message: expect.not.stringContaining('provider internal detail'),
    })
  })

  it.each([500, 502, 503])('maps HTTP %i to SERVER_ERROR', async (status) => {
    installMockXhr({ status, responseText: '{}' })
    const provider = new CloudinaryImageStorageProvider('demo', 'preset')

    await expect(
      provider.upload({ file: new Blob(['x']), galleryItemId: 'a' }),
    ).rejects.toMatchObject({ code: 'SERVER_ERROR' })
  })

  it('maps network failure to NETWORK_ERROR', async () => {
    installMockXhr({
      onSend(xhr) {
        xhr.onerror?.()
      },
    })
    const provider = new CloudinaryImageStorageProvider('demo', 'preset')

    await expect(
      provider.upload({ file: new Blob(['x']), galleryItemId: 'a' }),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('maps abort to UPLOAD_CANCELLED', async () => {
    installMockXhr({
      onSend(xhr) {
        xhr.onabort?.()
      },
    })
    const provider = new CloudinaryImageStorageProvider('demo', 'preset')

    await expect(
      provider.upload({ file: new Blob(['x']), galleryItemId: 'a' }),
    ).rejects.toMatchObject({ code: 'UPLOAD_CANCELLED' })
  })

  it('maps malformed JSON response to INVALID_RESPONSE', async () => {
    installMockXhr({ responseText: 'not-json' })
    const provider = new CloudinaryImageStorageProvider('demo', 'preset')

    await expect(
      provider.upload({ file: new Blob(['x']), galleryItemId: 'a' }),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('maps missing secure_url to INVALID_RESPONSE', async () => {
    installMockXhr({ responseText: JSON.stringify({ public_id: 'x' }) })
    const provider = new CloudinaryImageStorageProvider('demo', 'preset')

    await expect(
      provider.upload({ file: new Blob(['x']), galleryItemId: 'a' }),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('reports monotonic upload progress ending at 100', async () => {
    installMockXhr({
      onSend(xhr) {
        xhr.upload.onprogress?.({
          lengthComputable: true,
          loaded: 50,
          total: 100,
        } as ProgressEvent)
        xhr.upload.onprogress?.({
          lengthComputable: true,
          loaded: 100,
          total: 100,
        } as ProgressEvent)
        xhr.onload?.()
      },
    })

    const progress: number[] = []
    const provider = new CloudinaryImageStorageProvider('demo', 'preset')
    await provider.upload(
      { file: new Blob(['x']), galleryItemId: 'a' },
      (p) => progress.push(p),
    )

    expect(progress[0]).toBe(0)
    expect(progress).toEqual([0, 50, 99, 100])
  })

  it('delete is a no-op on MVP', async () => {
    const provider = new CloudinaryImageStorageProvider('demo', 'preset')
    await expect(provider.delete('makeng-gallery/item-1')).resolves.toBeUndefined()
  })
})

describe('imageStorageErrorFromHttpStatus', () => {
  it('uses stable messages without raw provider text', async () => {
    const { imageStorageErrorFromHttpStatus } = await import('../imageStorageErrors')
    const err = imageStorageErrorFromHttpStatus(400, 'raw cloudinary message')
    expect(err.message).not.toContain('raw cloudinary message')
    expect(err.debugDetail).toBe('raw cloudinary message')
  })
})
