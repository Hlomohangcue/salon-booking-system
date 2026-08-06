import type { ReactNode } from 'react'
import type { Booking } from '../../booking/types'
import StatusBadge from './ui/StatusBadge'
import Button from '../../../components/ui/Button'
import { formatDisplayDate, formatTime12h } from '../../booking/utils/dateHelpers'

/**
 * Action callbacks wired to the admin booking service. Firestore mutations are
 * never performed here — this component only renders and forwards user intent.
 */
export interface BookingDetailActions {
  /** Confirm a pending booking. */
  confirm: (bookingId: string) => Promise<void>
  /** Cancel a booking (optionally with a reason). */
  cancel: (bookingId: string, reason?: string) => Promise<void>
  /** Mark a booking as completed. */
  complete: (bookingId: string) => Promise<void>
  /** Mark a booking as a no-show. */
  noShow: (bookingId: string) => Promise<void>
}

interface BookingDetailPanelProps {
  /** The booking whose details are displayed. */
  booking: Booking
  /** Status-transition action callbacks. */
  actions: BookingDetailActions
  /** True while a mutation is in flight (disables action buttons). */
  mutating?: boolean
  /** Optional content rendered at the top (e.g. a close "back to list" control). */
  headerSlot?: ReactNode
}

interface DetailRowProps {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
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
 * Reusable, presentation-only booking detail panel.
 *
 * Displays a booking's full snapshot and renders context-aware action buttons
 * based on its current status. All data mutation is delegated to the `actions`
 * callbacks provided by the parent (typically from `useAdminBookings`).
 */
export default function BookingDetailPanel({
  booking,
  actions,
  mutating = false,
  headerSlot,
}: BookingDetailPanelProps) {
  const { confirm, cancel, complete, noShow } = actions

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-700">
            Booking Details
          </p>
          <h3 className="font-display text-base font-semibold text-gray-900 mt-0.5">
            {booking.customerName}
          </h3>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {headerSlot && <div className="px-5 pt-4">{headerSlot}</div>}

      {/* Details */}
      <dl className="px-5 py-3 divide-y divide-gray-50">
        <DetailRow label="Service" value={booking.serviceName} />
        <DetailRow label="Date" value={formatDisplayDate(booking.preferredDate)} />
        <DetailRow label="Time" value={formatTime12h(booking.preferredTime)} />
        <DetailRow label="Duration" value={`${booking.serviceDuration} min`} />
        <DetailRow label="Price" value={`M${booking.servicePrice}`} />
        <DetailRow label="Phone" value={booking.phoneNumber} />
        <DetailRow label="Email" value={booking.email || '—'} />
        <DetailRow label="Notes" value={booking.notes || '—'} />
        <DetailRow label="Reference" value={booking.bookingId} />
      </dl>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-100">
        {booking.status === 'pending' && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => void confirm(booking.bookingId)}
              disabled={mutating}
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void cancel(booking.bookingId)}
              disabled={mutating}
            >
              Cancel
            </Button>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => void complete(booking.bookingId)}
              disabled={mutating}
            >
              Mark Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void noShow(booking.bookingId)}
              disabled={mutating}
            >
              Mark No-Show
            </Button>
          </div>
        )}

        {booking.status === 'cancelled' && booking.cancellationReason && (
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Cancellation reason:</span>{' '}
            {booking.cancellationReason}
          </p>
        )}

        {(booking.status === 'completed' || booking.status === 'no-show') && (
          <p className="text-sm text-gray-500">
            This appointment is <span className="font-medium text-gray-700">{booking.status}</span>.
          </p>
        )}
      </div>
    </div>
  )
}
