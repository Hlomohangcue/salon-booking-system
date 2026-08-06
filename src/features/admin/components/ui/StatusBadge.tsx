import type { BookingStatus } from '../../../booking/types'

/**
 * Visual status pill for a booking status. Maps each status to a consistent
 * colour scheme so admins can scan appointment states at a glance.
 */
const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'no-show': 'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  'no-show': 'No Show',
}

interface StatusBadgeProps {
  status: BookingStatus
  className?: string
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_STYLES[status],
        className,
      ].join(' ')}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
