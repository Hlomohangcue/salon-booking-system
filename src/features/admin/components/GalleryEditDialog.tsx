import { useRef, useState } from 'react'
import Dialog from './Dialog'
import GalleryMetadataForm from './GalleryMetadataForm'
import Button from '../../../components/ui/Button'
import type { GalleryItem } from '../../gallery/types'
import type { GalleryMetadataOutput } from '../../gallery/galleryValidation'
import { formatFeaturedUntilDate } from '../../gallery/galleryMetadataHelpers'
import {
  compressImageToWebP,
  ImageValidationError,
} from '../../gallery/imageProcessing'
import { GALLERY_ACCEPTED_MIME_TYPES } from '../../gallery/types'

interface GalleryEditDialogProps {
  item: GalleryItem | null
  onClose: () => void
  onSaveMetadata: (galleryItemId: string, metadata: GalleryMetadataOutput) => Promise<void>
  onReplaceImage: (galleryItemId: string, file: Blob) => Promise<void>
  submitting?: boolean
  uploadProgress?: number | null
}

export default function GalleryEditDialog({
  item,
  onClose,
  onSaveMetadata,
  onReplaceImage,
  submitting = false,
  uploadProgress = null,
}: GalleryEditDialogProps) {
  const [replaceError, setReplaceError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleReplace = async (file: File) => {
    if (!item) return
    setReplaceError(null)
    try {
      const compressed = await compressImageToWebP(file)
      await onReplaceImage(item.galleryItemId, compressed)
    } catch (err: unknown) {
      setReplaceError(
        err instanceof ImageValidationError
          ? err.message
          : 'Unable to replace image.',
      )
    }
  }

  return (
    <Dialog
      title="Edit Gallery Photo"
      description="Update metadata or replace the image."
      open={item !== null}
      onClose={onClose}
    >
      {item && (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-24 h-24 rounded-lg object-cover bg-gray-100 shrink-0"
            />
            <div className="space-y-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={submitting}
                onClick={() => inputRef.current?.click()}
              >
                Replace Image
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept={GALLERY_ACCEPTED_MIME_TYPES.join(',')}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleReplace(file)
                  e.target.value = ''
                }}
              />
              {replaceError && (
                <p className="text-xs text-red-600" role="alert">
                  {replaceError}
                </p>
              )}
              {uploadProgress !== null && submitting && (
                <p className="text-xs text-gray-500">Uploading… {uploadProgress}%</p>
              )}
            </div>
          </div>

          <GalleryMetadataForm
            defaultValues={{
              title: item.title,
              description: item.description,
              category: item.category,
              displayOrder: item.displayOrder,
              isPublished: item.isPublished,
              isFeatured: item.isFeatured,
              featuredUntil: formatFeaturedUntilDate(item.featuredUntil),
            }}
            onSubmit={async (metadata) => {
              await onSaveMetadata(item.galleryItemId, metadata)
              onClose()
            }}
            onCancel={onClose}
            submitting={submitting}
            submitLabel="Save Changes"
          />
        </div>
      )}
    </Dialog>
  )
}
