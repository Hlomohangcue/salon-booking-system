import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import type { ServicePerformanceRow } from '../types'

interface ServicePerformanceTableProps {
  rows: ServicePerformanceRow[]
}

const COLUMNS: DataTableColumn<ServicePerformanceRow>[] = [
  {
    key: 'name',
    header: 'Service',
    cell: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
  },
  {
    key: 'category',
    header: 'Category',
    cell: (row) => {
      const label = row.category.charAt(0).toUpperCase() + row.category.slice(1)
      return <span className="text-gray-600 capitalize">{label}</span>
    },
  },
  {
    key: 'bookings',
    header: 'Bookings',
    align: 'right',
    cell: (row) => row.bookings,
  },
  {
    key: 'completed',
    header: 'Completed',
    align: 'right',
    cell: (row) => row.completed,
  },
  {
    key: 'revenue',
    header: 'Revenue',
    align: 'right',
    cell: (row) => `M${row.revenue.toLocaleString()}`,
  },
  {
    key: 'avgPrice',
    header: 'Avg Price',
    align: 'right',
    cell: (row) => (row.avgPrice > 0 ? `M${row.avgPrice.toLocaleString()}` : '—'),
  },
]

/**
 * Service Performance table reusing the generic DataTable component.
 * Shows aggregate booking and revenue metrics per service.
 */
export default function ServicePerformanceTable({
  rows,
}: ServicePerformanceTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      rows={rows}
      rowKey={(row) => row.serviceId}
    />
  )
}
