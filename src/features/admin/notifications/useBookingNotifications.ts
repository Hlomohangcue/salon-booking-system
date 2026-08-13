import { useCallback, useEffect, useState } from 'react'
import type { NotificationChannel, BookingNotificationState } from './types'
import { resendNotification, subscribeToNotificationDeliveries } from './notificationService'

export interface UseBookingNotificationsReturn extends BookingNotificationState {
  resendingChannel: NotificationChannel | null
  resendError: string | null
  resend: (channel: NotificationChannel) => Promise<void>
}

/**
 * Loads and subscribes to notification delivery records for a booking.
 * Provides a guarded resend action via the secure Cloud Function callable.
 */
export function useBookingNotifications(
  bookingId: string | undefined,
  enabled: boolean,
): UseBookingNotificationsReturn {
  const [email, setEmail] = useState<BookingNotificationState['email']>(null)
  const [whatsapp, setWhatsapp] = useState<BookingNotificationState['whatsapp']>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendingChannel, setResendingChannel] = useState<NotificationChannel | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookingId || !enabled) {
      setEmail(null)
      setWhatsapp(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToNotificationDeliveries(
      bookingId,
      (state) => {
        setEmail(state.email)
        setWhatsapp(state.whatsapp)
        setLoading(false)
      },
      (message) => {
        setError(message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [bookingId, enabled])

  const resend = useCallback(
    async (channel: NotificationChannel) => {
      if (!bookingId || resendingChannel) return
      setResendingChannel(channel)
      setResendError(null)
      try {
        await resendNotification(bookingId, channel)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Unable to resend notification. Please try again.'
        setResendError(message)
      } finally {
        setResendingChannel(null)
      }
    },
    [bookingId, resendingChannel],
  )

  return {
    email,
    whatsapp,
    loading,
    error,
    resendingChannel,
    resendError,
    resend,
  }
}
