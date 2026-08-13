import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import DashboardCard from '../components/ui/DashboardCard'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import Button from '../../../components/ui/Button'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useAuth } from '../../auth/hooks/useAuth'
import { useAdminGallery } from '../hooks/useAdminGallery'
import GalleryTable from '../components/GalleryTable'
import GalleryUploadDialog from '../components/GalleryUploadDialog'
import GalleryEditDialog from '../components/GalleryEditDialog'
import DeleteGalleryDialog from '../components/DeleteGalleryDialog'
import type { GalleryItem } from '../../gallery/types'
import type { GalleryCategory } from '../../gallery/types'
import { GALLERY_CATEGORY_OPTIONS } from '../../gallery/galleryValidation'

type StatusFilter = 'all' | 'published' | 'draft'
type CategoryFilter = 'all' | GalleryCategory

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
]

export default function AdminGalleryPage() {
  usePageTitle('Gallery')

  const { adminUser } = useAuth()
  const {
    items,
    loading,
    error,
    refresh,
    mutating,
    mutationError,
    successMessage,
    uploadProgress,
    uploadAction,
    updateMetadataAction,
    replaceImageAction,
    publishAction,
    unpublishAction,
    deleteAction,
    getSuggestedDisplayOrder,
  } = useAdminGallery()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [suggestedOrder, setSuggestedOrder] = useState(0)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [deleting, setDeleting] = useState<GalleryItem | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter === 'published' && !item.isPublished) return false
      if (statusFilter === 'draft' && item.isPublished) return false
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (q && !item.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, search, statusFilter, categoryFilter])

  const openUpload = async () => {
    const order = await getSuggestedDisplayOrder()
    setSuggestedOrder(order)
    setUploadOpen(true)
  }

  const handleUpload = async (file: Blob, metadata: Parameters<typeof uploadAction>[1]) => {
    if (!adminUser?.uid) return
    await uploadAction(file, metadata, adminUser.uid)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Management"
        title="Gallery"
        description="Upload and manage photos for the Our Work section on the website."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Refresh
            </Button>
            <Button size="sm" onClick={() => void openUpload()}>
              Upload Photo
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {mutationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {mutationError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <DashboardCard title="Our Work Photos" description="Filter and manage gallery items">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {GALLERY_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5">
          {loading ? (
            <LoadingState label="Loading gallery" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No photos found"
              description={
                items.length === 0
                  ? 'Upload your first salon work photo to populate the Our Work section.'
                  : 'Try adjusting your search or filters.'
              }
              action={
                items.length === 0 ? (
                  <Button size="sm" onClick={() => void openUpload()}>
                    Upload Photo
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <GalleryTable
              items={filtered}
              onEdit={setEditing}
              onPublish={(id) => void publishAction(id)}
              onUnpublish={(id) => void unpublishAction(id)}
              onDelete={setDeleting}
              mutating={mutating}
            />
          )}
        </div>
      </DashboardCard>

      <GalleryUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
        suggestedDisplayOrder={suggestedOrder}
        submitting={mutating}
        uploadProgress={uploadProgress}
      />

      <GalleryEditDialog
        item={editing}
        onClose={() => setEditing(null)}
        onSaveMetadata={(id, metadata) => updateMetadataAction(id, metadata)}
        onReplaceImage={(id, file) => replaceImageAction(id, file)}
        submitting={mutating}
        uploadProgress={uploadProgress}
      />

      <DeleteGalleryDialog
        item={deleting}
        onConfirm={async (id) => {
          await deleteAction(id)
          setDeleting(null)
        }}
        onClose={() => setDeleting(null)}
        mutating={mutating}
      />
    </div>
  )
}
