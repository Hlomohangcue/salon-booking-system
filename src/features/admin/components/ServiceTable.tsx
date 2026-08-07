import DataTable, { type DataTableColumn } from './ui/DataTable'
import Button from '../../../components/ui/Button'
import type { Service } from '../../booking/types'
import { CATEGORY_LABELS } from '../services/serviceValidation'

interface ServiceTableProps {
  /** The (already filtered) list of services to render. */
  services: Service[]
  /** Called when the user clicks "Edit". */
  onEdit: (service: Service) => void
  /** Called when the user clicks "Archive" (only for active services). */
  onArchive: (serviceId: string) => void
  /** Called when the user clicks "Restore" (only for archived services). */
  onRestore: (serviceId: string) => void
  /** Called when the user clicks "Delete" (only for archived services with no bookings). */
  onDelete: (service: Service) => void
  /** True while a mutation is in flight — disables action buttons. */
  mutating: boolean
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        active
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-gray-100 text-gray-600 border-gray-200',
      ].join(' ')}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

/**
 * Renders a services table using the generic DataTable component.
 *
 * All action callbacks are presentation-only — no business logic lives here.
 * The parent page wires these into the hook's mutation actions.
 */
export default function ServiceTable({
  services,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  mutating,
}: ServiceTableProps) {
  const columns: DataTableColumn<Service>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <div>
          <span className="font-medium text-gray-900">{row.name}</span>
          {!row.isActive && (
            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              Archived
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row) => (
        <span className="text-sm text-gray-600">{CATEGORY_LABELS[row.category]}</span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      cell: (row) => `${row.durationMinutes} min`,
    },
    {
      key: 'price',
      header: 'Price',
      cell: (row) => `M${row.priceFrom}`,
    },
    {
      key: 'sortOrder',
      header: 'Sort',
      cell: (row) => (
        <span className="text-sm text-gray-500">{row.sortOrder}</span>
      ),
    },
    {
      key: 'active',
      header: 'Active',
      cell: (row) => <ActiveBadge active={row.isActive} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row)}
            disabled={mutating}
          >
            Edit
          </Button>
          {row.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchive(row.serviceId)}
              disabled={mutating}
            >
              Archive
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestore(row.serviceId)}
                disabled={mutating}
              >
                Restore
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(row)}
                disabled={mutating}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={services}
      rowKey={(row) => row.serviceId}
    />
  )
}
