import DataTable, { type DataTableColumn } from './ui/DataTable'
import Button from '../../../components/ui/Button'
import type { CustomerWithStats } from '../hooks/useAdminCustomers'
import { format } from 'date-fns'

interface CustomerTableProps {
  /** The (already filtered) list of customers to render. */
  customers: CustomerWithStats[]
  /** Called when the user clicks "View". */
  onView: (customer: CustomerWithStats) => void
  /** True while a mutation is in flight — disables action buttons. */
  mutating: boolean
}

function StatusBadge({ archived }: { archived: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        archived
          ? 'bg-gray-100 text-gray-600 border-gray-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ].join(' ')}
    >
      {archived ? 'Archived' : 'Active'}
    </span>
  )
}

/**
 * Renders a customers table using the generic DataTable component.
 *
 * All action callbacks are presentation-only — the parent page wires them into
 * the hook's mutation/selection actions. The "Total Bookings" / "Last Visit"
 * columns display stats that were derived in the hook, never recomputed here.
 */
export default function CustomerTable({
  customers,
  onView,
  mutating,
}: CustomerTableProps) {
  const columns: DataTableColumn<CustomerWithStats>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <span className="font-medium text-gray-900">{row.customerName}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (row) => <span className="text-sm text-gray-600">{row.phoneNumber}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      cell: (row) => (
        <span className="text-sm text-gray-600">{row.email || '—'}</span>
      ),
    },
    {
      key: 'totalBookings',
      header: 'Total Bookings',
      align: 'center',
      cell: (row) => <span className="text-sm text-gray-700">{row.totalBookings}</span>,
    },
    {
      key: 'lastVisit',
      header: 'Last Visit',
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {row.lastVisit ? format(row.lastVisit, 'MMM d, yyyy') : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge archived={row.archived} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(row)}
          disabled={mutating}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={customers}
      rowKey={(row) => row.customerId}
    />
  )
}

