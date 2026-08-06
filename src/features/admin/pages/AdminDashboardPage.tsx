import { useAuth } from '../../auth/hooks/useAuth'
import Button from '../../../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import DashboardCard from '../components/ui/DashboardCard'
import StatusBadge from '../components/ui/StatusBadge'
import DataTable, { type DataTableColumn } from '../components/ui/DataTable'
import LoadingState from '../components/ui/LoadingState'
import EmptyState from '../components/ui/EmptyState'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useAdminDashboard } from '../hooks/useAdminDashboard'
import type { Booking } from '../../booking/types'
import { formatTime12h } from '../../booking/utils/dateHelpers'

/** Format an ISO date "YYYY-MM-DD" to a short readable label (e.g. "Aug 5"). */
function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

interface RecentBookingRow {
  bookingId: string
  customer: string
  service: string
  date: string
  time: string
  status: Booking['status']
}

// ─── Stat card icons ─────────────────────────────────────────────────────────

function CalendarStatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function ClockStatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function CheckStatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function MoneyStatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

// ─── Column definitions for the recent bookings table ────────────────────────

const RECENT_COLUMNS: DataTableColumn<RecentBookingRow>[] = [
  {
    key: 'customer',
    header: 'Customer',
    cell: (row) => <span className="font-medium text-gray-900">{row.customer}</span>,
  },
  {
    key: 'service',
    header: 'Service',
    cell: (row) => row.service,
  },
  {
    key: 'date',
    header: 'Date',
    cell: (row) => formatShortDate(row.date),
  },
  {
    key: 'time',
    header: 'Time',
    cell: (row) => row.time,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => <StatusBadge status={row.status} />,
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { adminUser } = useAuth()
  const displayName = adminUser?.displayName ?? 'Admin'
  const { loading, error, stats, recentBookings, upcomingToday, refresh } =
    useAdminDashboard()

  usePageTitle('Dashboard')

  const recentRows: RecentBookingRow[] = recentBookings.map((b) => ({
    bookingId: b.bookingId,
    customer: b.customerName,
    service: b.serviceName,
    date: b.preferredDate,
    time: formatTime12h(b.preferredTime),
    status: b.status,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Dashboard"
        title={`Welcome, ${displayName}`}
        description="Here's what's happening at the salon today."
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Appointments"
          value={loading ? '…' : String(stats.todayAppointments)}
          hint="Across all services"
          icon={<CalendarStatIcon />}
          accent="purple"
        />
        <StatCard
          label="Pending Bookings"
          value={loading ? '…' : String(stats.pendingBookings)}
          hint="Awaiting confirmation"
          icon={<ClockStatIcon />}
          accent="amber"
        />
        <StatCard
          label="Completed Today"
          value={loading ? '…' : String(stats.completedToday)}
          hint="Today's completed appointments"
          icon={<CheckStatIcon />}
          accent="emerald"
        />
        <StatCard
          label="Monthly Revenue"
          value="Coming Soon"
          hint="Available after payment integration"
          icon={<MoneyStatIcon />}
          accent="blue"
        />
      </div>

      {/* Recent bookings + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent bookings */}
        <div className="lg:col-span-2">
          <DashboardCard
            title="Recent Bookings"
            description="Latest appointments"
            actions={
              <Button to="/admin/bookings" variant="ghost" size="sm">
                View all
              </Button>
            }
          >
            {loading ? (
              <LoadingState label="Loading recent bookings" />
            ) : recentRows.length === 0 ? (
              <EmptyState
                title="No bookings yet"
                description="Customer bookings will appear here."
              />
            ) : (
              <DataTable
                columns={RECENT_COLUMNS}
                rows={recentRows}
                rowKey={(row) => row.bookingId}
                empty={
                  <EmptyState
                    title="No bookings yet"
                    description="Customer bookings will appear here."
                  />
                }
              />
            )}
          </DashboardCard>
        </div>

        {/* Upcoming schedule */}
        <DashboardCard title="Upcoming Today" description="Next appointments">
          {loading ? (
            <LoadingState label="Loading today's schedule" />
          ) : upcomingToday.length === 0 ? (
            <EmptyState
              title="No appointments today"
              description="There are no active appointments scheduled for today."
            />
          ) : (
            <ul className="divide-y divide-gray-50">
              {upcomingToday.map((item) => (
                <li
                  key={item.bookingId}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 rounded-md px-2 py-1 shrink-0">
                    {item.time}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {item.customerName}
                    </p>
                    <p className="text-xs text-gray-500">{item.serviceName}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      {/* Quick actions */}
      <DashboardCard title="Quick Actions" description="Common admin tasks">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button to="/admin/services" variant="outline" size="sm" className="justify-center">
            Manage Services
          </Button>
          <Button to="/admin/bookings" variant="outline" size="sm" className="justify-center">
            Today's Bookings
          </Button>
          <Button to="/admin/settings" variant="outline" size="sm" className="justify-center">
            Booking Settings
          </Button>
        </div>
      </DashboardCard>
    </div>
  )
}
