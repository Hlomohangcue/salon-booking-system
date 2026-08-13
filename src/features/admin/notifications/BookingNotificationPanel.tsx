import Button from '../../../components/ui/Button'
import type { Booking } from '../../booking/types'
import type { NotificationDelivery, NotificationChannel } from './types'
import {
  formatErrorCode,
  formatSkipReason,
  maskEmail,
  maskPhone,
} from './notificationMessages'

interface BookingNotificationPanelProps {
  booking: Booking
  email: NotificationDelivery | null
  whatsapp: NotificationDelivery | null
  loading?: boolean
  error?: string | null
  resendingChannel?: NotificationChannel | null
  resendError?: string | null
  onResend: (channel: NotificationChannel) => void
}

function StatusIndicator({ status }: { status: NotificationDelivery['status'] }) {
  switch (status) {
    case 'sent':
      return <span className="text-emerald-600 font-medium" aria-label="Sent">✓ Sent</span>
    case 'failed':
      return <span className="text-red-600 font-medium" aria-label="Failed">✕ Failed</span>
    case 'skipped':
      return <span className="text-gray-500 font-medium" aria-label="Skipped">— Skipped</span>
    case 'processing':
      return <span className="text-amber-600 font-medium" aria-label="Processing">… Processing</span>
    default:
      return <span className="text-gray-400 font-medium" aria-label="Pending">○ Pending</span>
  }
}

function canRetry(
  delivery: NotificationDelivery | null,
  channel: NotificationChannel,
  booking: Booking,
): boolean {
  if (!delivery) return false
  if (delivery.status === 'processing') return false

  if (delivery.status === 'failed' || delivery.status === 'skipped') {
    if (delivery.skipReason === 'missing_recipient') {
      return channel === 'email' ? Boolean(booking.email?.trim()) : Boolean(booking.phoneNumber?.trim())
    }
    if (delivery.skipReason === 'invalid_recipient') {
      return channel === 'whatsapp'
    }
    return true
  }

  if (delivery.status === 'sent') return true
  return false
}

function retryLabel(delivery: NotificationDelivery | null): string {
  if (delivery?.status === 'sent') return 'Resend'
  return 'Retry'
}

interface ChannelRowProps {
  label: string
  channel: NotificationChannel
  delivery: NotificationDelivery | null
  booking: Booking
  resending: boolean
  onResend: (channel: NotificationChannel) => void
}

function ChannelRow({
  label,
  channel,
  delivery,
  booking,
  resending,
  onResend,
}: ChannelRowProps) {
  if (!delivery) {
    return (
      <div className="py-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm text-gray-400 mt-0.5">No notification data yet</p>
      </div>
    )
  }

  const showRetry = canRetry(delivery, channel, booking)
  const isProcessing = delivery.status === 'processing'
  const isDisabled = delivery.skipReason === 'disabled'

  return (
    <div className="py-2 space-y-1">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {isDisabled ? (
          <span className="text-gray-500 font-medium">— Disabled</span>
        ) : (
          <StatusIndicator status={delivery.status} />
        )}
      </div>

      {delivery.provider && delivery.status !== 'pending' && (
        <p className="text-xs text-gray-400">Provider: {delivery.provider}</p>
      )}

      {delivery.sentAt && (
        <p className="text-xs text-gray-500">
          Sent {delivery.sentAt.toLocaleString()}
        </p>
      )}

      {delivery.recipient && delivery.status !== 'skipped' && (
        <p className="text-xs text-gray-500">
          Recipient:{' '}
          {channel === 'email' ? maskEmail(delivery.recipient) : maskPhone(delivery.recipient)}
        </p>
      )}

      {delivery.status === 'failed' && (
        <p className="text-xs text-red-600">
          Reason: {formatErrorCode(delivery.errorCode, delivery.errorMessage)}
        </p>
      )}

      {delivery.status === 'skipped' && delivery.skipReason && (
        <p className="text-xs text-gray-500">
          Reason: {formatSkipReason(delivery.skipReason)}
        </p>
      )}

      {isProcessing && (
        <p className="text-xs text-amber-600">Notification is currently processing.</p>
      )}

      {showRetry && (
        <Button
          size="sm"
          variant="outline"
          disabled={resending || isProcessing}
          onClick={() => onResend(channel)}
        >
          {resending ? 'Sending…' : `${retryLabel(delivery)} ${label}`}
        </Button>
      )}
    </div>
  )
}

/**
 * Admin notification status panel for a booking.
 * Read-only delivery state with guarded manual resend actions.
 */
export default function BookingNotificationPanel({
  booking,
  email,
  whatsapp,
  loading = false,
  error = null,
  resendingChannel = null,
  resendError = null,
  onResend,
}: BookingNotificationPanelProps) {
  if (booking.status !== 'confirmed' && booking.status !== 'completed') {
    return null
  }

  return (
    <div className="px-5 py-4 border-t border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-widest text-purple-700 mb-2">
        Notifications
      </p>

      {loading && <p className="text-sm text-gray-400">Loading notification status…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {resendError && <p className="text-sm text-red-600 mb-2">{resendError}</p>}

      {!loading && (
        <div className="divide-y divide-gray-50">
          <ChannelRow
            label="Email"
            channel="email"
            delivery={email}
            booking={booking}
            resending={resendingChannel === 'email'}
            onResend={onResend}
          />
          <ChannelRow
            label="WhatsApp"
            channel="whatsapp"
            delivery={whatsapp}
            booking={booking}
            resending={resendingChannel === 'whatsapp'}
            onResend={onResend}
          />
        </div>
      )}
    </div>
  )
}
