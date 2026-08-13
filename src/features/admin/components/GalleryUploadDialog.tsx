import { useCallback, useEffect, useRef, useState } from 'react'
import Dialog from './Dialog'
import GalleryMetadataForm from './GalleryMetadataForm'
import Button from '../../../components/ui/Button'
import type { GalleryMetadataOutput } from '../../gallery/galleryValidation'
import {
  compressImageToWebP,
  createImagePreviewUrl,
  ImageValidationError,
} from '../../gallery/imageProcessing'
import { GALLERY_ACCEPTED_MIME_TYPES } from '../../gallery/types'

interface GalleryUploadDialogProps {
  open: boolean
  onClose: () => void
  onUpload: (file: Blob, metadata: GalleryMetadataOutput) => Promise<void>
  suggestedDisplayOrder: number
  submitting?: boolean
  uploadProgress?: number | null
}

/**
 * Upload dialog: file picker, preview, metadata form, and progress indicator.
 */
export default function GalleryUploadDialog({
  open,
  onClose,
  onUpload,
  suggestedDisplayOrder,
  submitting = false,
  uploadProgress = null,
}: GalleryUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [step, setStep] = useState<'file' | 'metadata'>('file')
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    setFileError(null)
    setStep('file')
  }, [previewUrl])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const handleFileChange = (file: File | null) => {
    setFileError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }
    try {
      const url = createImagePreviewUrl(file)
      setSelectedFile(file)
      setPreviewUrl(url)
      setStep('metadata')
    } catch (err: unknown) {
      setFileError(
        err instanceof ImageValidationError
          ? err.message
          : 'Unable to use this file.',
      )
    }
  }

  const handleSubmit = async (metadata: GalleryMetadataOutput) => {
    if (!selectedFile) return
    const compressed = await compressImageToWebP(selectedFile)
    await onUpload(compressed, metadata)
    onClose()
  }

  return (
    <Dialog
      title="Upload Photo"
      description="Add a new photo to the Our Work gallery."
      open={open}
      onClose={onClose}
    >
      {step === 'file' && (
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) handleFileChange(file)
            }}
          >
            <p className="text-sm text-gray-600 mb-3">
              Drag and drop an image here, or choose a file
            </p>
            <p className="text-xs text-gray-400 mb-4">JPEG, PNG, or WebP — max 5 MB</p>
            <Button
              type="button"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Choose Image
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={GALLERY_ACCEPTED_MIME_TYPES.join(',')}
              className="sr-only"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </div>
          {fileError && (
            <p className="text-sm text-red-600" role="alert">
              {fileError}
            </p>
          )}
        </div>
      )}

      {step === 'metadata' && previewUrl && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden aspect-video max-h-48 bg-gray-100">
            <img
              src={previewUrl}
              alt="Upload preview"
              className="w-full h-full object-contain"
            />
          </div>
          {uploadProgress !== null && submitting && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">Uploading… {uploadProgress}%</p>
            </div>
          )}
          <GalleryMetadataForm
            defaultValues={{
              displayOrder: suggestedDisplayOrder,
              isPublished: false,
              isFeatured: false,
            }}
            onSubmit={handleSubmit}
            onCancel={() => {
              reset()
              onClose()
            }}
            submitting={submitting}
            submitLabel="Upload Photo"
          />
        </div>
      )}
    </Dialog>
  )
}
