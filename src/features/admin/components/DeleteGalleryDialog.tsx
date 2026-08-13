import Dialog from './Dialog'
import Button from '../../../components/ui/Button'
import type { GalleryItem } from '../../gallery/types'

interface DeleteGalleryDialogProps {
  item: GalleryItem | null
  onConfirm: (galleryItemId: string) => Promise<void>
  onClose: () => void
  mutating?: boolean
}

export default function DeleteGalleryDialog({
  item,
  onConfirm,
  onClose,
  mutating = false,
}: DeleteGalleryDialogProps) {
  return (
    <Dialog
      title="Delete Photo"
      description="This permanently removes the photo from the gallery. The image may remain in Cloudinary until manually cleaned up."
      open={item !== null}
      onClose={onClose}
    >
      {item && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={item.imageUrl}
              alt=""
              className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0"
            />
            <p className="text-sm text-gray-700">
              Delete <span className="font-semibold">{item.title}</span>? This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={mutating}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={mutating}
              onClick={() => void onConfirm(item.galleryItemId)}
            >
              {mutating ? 'Deleting…' : 'Delete Photo'}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
