import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import DashboardCard from '../components/ui/DashboardCard'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import Button from '../../../components/ui/Button'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useAdminServices } from '../hooks/useAdminServices'
import ServiceTable from '../components/ServiceTable'
import ServiceForm from '../components/ServiceForm'
import DeleteServiceDialog from '../components/DeleteServiceDialog'
import Dialog from '../components/Dialog'
import type { Service } from '../../booking/types'
import { SERVICE_CATEGORY_OPTIONS } from '../services/serviceValidation'
import type { ServiceFormOutput } from '../services/serviceValidation'

type StatusFilter = 'all' | 'active' | 'inactive'
type CategoryFilter = 'all' | Service['category']

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

/** Service currently being edited, or null when the form dialog is closed. */
interface EditingState {
  service: Service
}

/**
 * Services management page.
 *
 * Lists all services from Firestore via `useAdminServices` and provides search,
 * category and active/inactive filters, create/edit/archive/restore/delete
 * workflows, and the required loading / empty / error states. The booking wizard
 * automatically reflects updates because it queries the same `services`
 * collection — only archived (isActive=false) services are hidden from customers.
 */
export default function AdminServicesPage() {
  usePageTitle('Services')

  const {
    services,
    loading,
    error,
    refresh,
    mutating,
    mutationError,
    successMessage,
    createServiceAction,
    updateServiceAction,
    archiveServiceAction,
    restoreServiceAction,
    deleteServiceAction,
    getUsageCount,
  } = useAdminServices()

  // ─── Local filter/state ────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  // Create dialog state
  const [creating, setCreating] = useState(false)

  // Edit dialog state
  const [editing, setEditing] = useState<EditingState | null>(null)

  // Delete dialog state
  const [deleting, setDeleting] = useState<Service | null>(null)
  const [usageCount, setUsageCount] = useState<number | null>(null)
  const [checkingUsage, setCheckingUsage] = useState(false)

  // ─── Derived filtered list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return services.filter((s) => {
      if (statusFilter === 'active' && !s.isActive) return false
      if (statusFilter === 'inactive' && s.isActive) return false
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
      if (q && !s.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [services, search, statusFilter, categoryFilter])

  // ─── Mutation handlers ─────────────────────────────────────────────────────
  const handleCreate = async (data: ServiceFormOutput): Promise<void> => {
    await createServiceAction(data)
    setCreating(false)
  }

  const handleUpdate = async (data: ServiceFormOutput): Promise<void> => {
    if (!editing) return
    await updateServiceAction(editing.service.serviceId, data)
    setEditing(null)
  }

  const handleArchive = (serviceId: string): void => {
    void archiveServiceAction(serviceId)
  }

  const handleRestore = (serviceId: string): void => {
    void restoreServiceAction(serviceId)
  }

  const openDelete = (service: Service): void => {
    setDeleting(service)
    setUsageCount(null)
    setCheckingUsage(true)
    getUsageCount(service.serviceId)
      .then((count) => setUsageCount(count))
      .catch(() => setUsageCount(-1)) // -1 signals a fetch failure
      .finally(() => setCheckingUsage(false))
  }

  const handleDelete = async (serviceId: string): Promise<void> => {
    await deleteServiceAction(serviceId)
    setDeleting(null)
    setUsageCount(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Management"
        title="Services"
        description="Add, edit, or deactivate salon services."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Refresh
            </Button>
            <Button size="sm" onClick={() => setCreating(true)}>
              Add Service
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

      <DashboardCard title="All Services" description="Filter and manage your service catalogue">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by service name…"
            className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {SERVICE_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table / states */}
        <div className="mt-5">
          {loading ? (
            <LoadingState label="Loading services" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No services found"
              description={
                services.length === 0
                  ? 'Add your first service to start accepting bookings.'
                  : 'Try adjusting your search or filters.'
              }
              action={
                services.length === 0 ? (
                  <Button size="sm" onClick={() => setCreating(true)}>
                    Add Service
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ServiceTable
              services={filtered}
              onEdit={(service) => setEditing({ service })}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onDelete={openDelete}
              mutating={mutating}
            />
          )}
        </div>
      </DashboardCard>

      {/* Create dialog */}
      <Dialog
        title="Add Service"
        description="Create a new service for customers to book."
        open={creating}
        onClose={() => setCreating(false)}
      >
        <ServiceForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitting={mutating}
        />
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        title="Edit Service"
        description="Update the details of this service."
        open={editing !== null}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <ServiceForm
            defaultValues={{
              name: editing.service.name,
              category: editing.service.category,
              durationMinutes: editing.service.durationMinutes,
              priceFrom: editing.service.priceFrom,
              description: editing.service.description,
              sortOrder: editing.service.sortOrder,
              isActive: editing.service.isActive,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitting={mutating}
          />
        )}
      </Dialog>

      {/* Delete dialog */}
      <DeleteServiceDialog
        service={deleting}
        onConfirm={handleDelete}
        onClose={() => {
          setDeleting(null)
          setUsageCount(null)
        }}
        mutating={mutating}
        usageCount={usageCount}
        checkingUsage={checkingUsage}
      />
    </div>
  )
}
