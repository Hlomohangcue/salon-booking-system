import type { ReactNode } from 'react'
import type { Booking } from '../../booking/types'
import Button from '../../../components/ui/Button'
import StatusBadge from './ui/StatusBadge'
import { formatDateStr, formatDisplayDate, formatTime12h } from '../../booking/utils/dateHelpers'
import type { CustomerWithStats } from '../hooks/useAdminCustomers'

interface CustomerDetailPanelProps {
  /** The customer being viewed, including derived stats. */
  customer: CustomerWithStats
  /** This customer's booking history (cached in the hook). */
  bookings: Booking[]
  /** Called to archive the customer. */
  onArchive: (customerId: string) => void
  /** Called to restore an archived customer. */
  onRestore: (customerId: string) => void
  /** True while a mutation is in flight. */
  mutating: boolean
  /** Optional header slot (e.g. a "back to list" control). */
  headerSlot?: ReactNode
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 shrink-0 pt-0.5">
        {label}
      </dt>
      <dd className="text-sm text-gray-800 text-right">{value}</dd>
    </div>
  )
}

/**
 * Reusable, presentation-only customer detail panel.
 *
 * Displays full customer metadata, derived stats, the booking history split
 * into "Upcoming" and "Past", and archive/restore actions. All mutations are
 * delegated to the parent via callbacks — this component never touches
 * Firestore and never recomputes stats that the hook already derived.
 */
export default function CustomerDetailPanel({
  customer,
  bookings,
  onArchive,
  onRestore,
  mutating,
  headerSlot,
}: CustomerDetailPanelProps) {
  const todayISO = formatDateStr(new Date())

  const upcoming = bookings
    .filter(
      (b) =>
        b.preferredDate >= todayISO &&
        (b.status === 'pending' || b.status === 'confirmed'),
    )
    .sort((a, b) => a.preferredDate.localeCompare(b.preferredDate))

  const upcomingIds = new Set(upcoming.map((b) => b.bookingId))
  const history = bookings
    .filter((b) => !upcomingIds.has(b.bookingId))
    .sort((a, b) => b.preferredDate.localeCompare(a.preferredDate))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-700">
            Customer Details
          </p>
          <h3 className="font-display text-base font-semibold text-gray-900 mt-0.5">
            {customer.customerName}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={[
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
              customer.archived
                ? 'bg-gray-100 text-gray-600 border-gray-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200',
            ].join(' ')}
          >
            {customer.archived ? 'Archived' : 'Active'}
          </span>
          {customer.archived ? (
            <Button size="sm" onClick={() => onRestore(customer.customerId)} disabled={mutating}>
              Restore
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onArchive(customer.customerId)} disabled={mutating}>
              Archive
            </Button>
          )}
        </div>
      </div>

      {headerSlot && <div className="px-5 pt-4">{headerSlot}</div>}

      {/* Identity + stats */}
      <dl className="px-5 py-3 divide-y divide-gray-50">
        <DetailRow label="Phone" value={customer.phoneNumber} />
        <DetailRow label="Email" value={customer.email || '—'} />
        <DetailRow label="Total Bookings" value={String(customer.totalBookings)} />
        <DetailRow label="Upcoming" value={String(customer.upcomingCount)} />
        <DetailRow
          label="Last Visit"
          value={
            customer.lastVisit
              ? formatDateStr(customer.lastVisit)
              : '—'
          }
        />
        <DetailRow label="Reference" value={customer.customerId} />
      </dl>

      {/* Upcoming bookings */}
      <div className="px-5 py-4 border-t border-gray-100">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Upcoming Bookings
        </h4>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming appointments.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {upcoming.map((b) => (
              <li key={b.bookingId} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.serviceName}</p>
                  <p className="text-xs text-gray-500">
                    {formatDisplayDate(b.preferredDate)} · {formatTime12h(b.preferredTime)}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Booking history */}
      <div className="px-5 py-4 border-t border-gray-100">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Booking History
        </h4>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No past appointments.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {history.slice(0, 10).map((b) => (
              <li key={b.bookingId} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.serviceName}</p>
                  <p className="text-xs text-gray-500">
                    {formatDisplayDate(b.preferredDate)} · {formatTime12h(b.preferredTime)}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notes */}
      <div className="px-5 py-4 border-t border-gray-100">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Notes
        </h4>
        {bookings.some((b) => b.notes) ? (
          <ul className="space-y-2">
            {bookings
              .filter((b) => b.notes)
              .slice(0, 5)
              .map((b) => (
                <li key={b.bookingId} className="text-sm text-gray-600">
                  <span className="text-gray-400">
                    {formatDisplayDate(b.preferredDate)} · {formatTime12h(b.preferredTime)}:
                  </span>{' '}
                  {b.notes}
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No notes recorded.</p>
        )}
      </div>
    </div>
  )
}

