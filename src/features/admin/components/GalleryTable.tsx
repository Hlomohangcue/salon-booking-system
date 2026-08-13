import DataTable, { type DataTableColumn } from './ui/DataTable'
import Button from '../../../components/ui/Button'
import type { GalleryItem } from '../../gallery/types'
import { GALLERY_CATEGORY_LABELS } from '../../gallery/galleryValidation'
import { isFeaturedActiveIncludingOpenEnded } from '../../gallery/galleryService'

interface GalleryTableProps {
  items: GalleryItem[]
  onEdit: (item: GalleryItem) => void
  onPublish: (galleryItemId: string) => void
  onUnpublish: (galleryItemId: string) => void
  onDelete: (item: GalleryItem) => void
  mutating: boolean
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        published
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-gray-100 text-gray-600 border-gray-200',
      ].join(' ')}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  )
}

export default function GalleryTable({
  items,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
  mutating,
}: GalleryTableProps) {
  const columns: DataTableColumn<GalleryItem>[] = [
    {
      key: 'thumb',
      header: '',
      cell: (row) => (
        <img
          src={row.imageUrl}
          alt=""
          className="w-12 h-12 rounded-lg object-cover bg-gray-100"
          loading="lazy"
        />
      ),
    },
    {
      key: 'title',
      header: 'Title',
      cell: (row) => (
        <div>
          <span className="font-medium text-gray-900">{row.title}</span>
          {isFeaturedActiveIncludingOpenEnded(row) && (
            <span className="ml-2 text-[10px] font-semibold uppercase text-purple-700">
              Featured
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row) => (
        <span className="text-sm text-gray-600">{GALLERY_CATEGORY_LABELS[row.category]}</span>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      cell: (row) => row.displayOrder,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge published={row.isPublished} />,
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex flex-wrap gap-1 justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={mutating}
            onClick={() => onEdit(row)}
          >
            Edit
          </Button>
          {row.isPublished ? (
            <Button
              size="sm"
              variant="outline"
              disabled={mutating}
              onClick={() => onUnpublish(row.galleryItemId)}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={mutating}
              onClick={() => onPublish(row.galleryItemId)}
            >
              Publish
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={mutating}
            onClick={() => onDelete(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} rows={items} rowKey={(row) => row.galleryItemId} />
}
