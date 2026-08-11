import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import DashboardCard from '../components/ui/DashboardCard'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import StatusBadge from '../components/ui/StatusBadge'
import DataTable, { type DataTableColumn } from '../components/ui/DataTable'
import BookingDetailPanel from '../components/BookingDetailPanel'
import Button from '../../../components/ui/Button'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useAdminBookings } from '../hooks/useAdminBookings'
import type { Booking, BookingStatus } from '../../booking/types'
import { formatDisplayDate, formatTime12h } from '../../booking/utils/dateHelpers'

type StatusFilter = 'all' | BookingStatus

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No Show' },
]

/** Normalise a search string for case-insensitive substring matching. */
function norm(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Bookings management page.
 *
 * Lists all bookings from Firestore via `useAdminBookings` and provides search,
 * date, and status filters, column sorting, loading/error/empty states, and a
 * detail panel for performing status transitions. All mutation logic lives in
 * the hook/service layer — this page stays focused on presentation.
 */
export default function AdminBookingsPage() {
  usePageTitle('Bookings')

  const {
    bookings,
    loading,
    error,
    refresh,
    mutating,
    mutationError,
    confirm,
    cancel,
    complete,
    noShow,
  } = useAdminBookings()

  // ─── Local filter/sort state ───────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<'preferredDate' | 'preferredTime' | 'customerName'>(
    'preferredDate',
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ─── Derived filtered + sorted list ────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = norm(search)
    return bookings
      .filter((b) => {
        if (statusFilter !== 'all' && b.status !== statusFilter) return false
        if (dateFilter && b.preferredDate !== dateFilter) return false
        if (
          q &&
          !norm(b.customerName).includes(q) &&
          !b.phoneNumber.includes(q) &&
          !b.bookingId.toLowerCase().includes(q)
        ) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        const left = a[sortKey]
        const right = b[sortKey]
        return left.localeCompare(right)
      })
  }, [bookings, search, dateFilter, statusFilter, sortKey])

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.bookingId === selectedId) ?? null,
    [bookings, selectedId],
  )

  const columns: DataTableColumn<Booking>[] = useMemo(
    () => [
      {
        key: 'customer',
        header: 'Customer',
        sortable: true,
        cell: (row) => (
          <span className="font-medium text-gray-900">{row.customerName}</span>
        ),
      },
      {
        key: 'service',
        header: 'Service',
        cell: (row) => row.serviceName,
      },
      {
        key: 'date',
        header: 'Date',
        sortable: true,
        cell: (row) => formatDisplayDate(row.preferredDate),
      },
      {
        key: 'time',
        header: 'Time',
        sortable: true,
        cell: (row) => formatTime12h(row.preferredTime),
      },
      {
        key: 'phone',
        header: 'Phone',
        cell: (row) => row.phoneNumber,
      },
      {
        key: 'status',
        header: 'Status',
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedId(row.bookingId)}
          >
            View
          </Button>
        ),
      },
    ],
    [setSelectedId],
  )

  // Map the sort key to the matching column key so `aria-sort` lands on the
  // correct header (e.g. sorting by `preferredDate` highlights the Date column).
  const sortColumnKey = useMemo(() => {
    switch (sortKey) {
      case 'preferredDate':
        return 'date'
      case 'preferredTime':
        return 'time'
      case 'customerName':
        return 'customer'
      default:
        return undefined
    }
  }, [sortKey])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Management"
        title="Bookings"
        description="Review and manage customer appointments."
        actions={
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {mutationError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {mutationError}
        </div>
      )}

      {/* Filters */}
      <DashboardCard title="All Bookings" description="Filter and manage appointments">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or reference…"
            className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            aria-label="Filter by date"
          />
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
          <select
            value={sortKey}
            onChange={(e) =>
              setSortKey(e.target.value as 'preferredDate' | 'preferredTime' | 'customerName')
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            aria-label="Sort bookings"
          >
            <option value="preferredDate">Sort by date</option>
            <option value="preferredTime">Sort by time</option>
            <option value="customerName">Sort by customer</option>
          </select>
        </div>

        <div className="mt-5">
          {loading ? (
            <LoadingState label="Loading bookings" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No bookings found"
              description="Try adjusting your search or filters, or wait for new customer bookings."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(row) => row.bookingId}
              sortBy={sortColumnKey}
              empty={
                <EmptyState
                  title="No bookings found"
                  description="Try adjusting your search or filters."
                />
              }
            />
          )}
        </div>
      </DashboardCard>

      {/* Detail panel */}
      {selectedBooking && (
        <BookingDetailPanel
          booking={selectedBooking}
          actions={{ confirm, cancel, complete, noShow }}
          mutating={mutating}
          headerSlot={
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
              ← Back to list
            </Button>
          }
        />
      )}
    </div>
  )
}
