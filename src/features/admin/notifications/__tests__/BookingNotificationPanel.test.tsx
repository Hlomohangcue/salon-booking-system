import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BookingNotificationPanel from '../BookingNotificationPanel'
import type { Booking } from '../../../booking/types'
import type { NotificationDelivery } from '../types'

const baseBooking: Booking = {
  bookingId: 'bk-ui-001',
  customerName: 'Test Customer',
  phoneNumber: '+26652000001',
  email: 'test@example.com',
  serviceId: 'svc-1',
  serviceName: 'Haircut',
  serviceDuration: 30,
  servicePrice: 100,
  preferredDate: '2026-08-12',
  preferredTime: '10:00',
  status: 'confirmed',
  source: 'web',
  createdAt: new Date('2026-08-12T08:00:00'),
  updatedAt: new Date('2026-08-12T08:00:00'),
}

function makeDelivery(
  channel: 'email' | 'whatsapp',
  overrides: Partial<NotificationDelivery> = {},
): NotificationDelivery {
  return {
    deliveryId: `bk-ui-001:confirmation:${channel}`,
    bookingId: 'bk-ui-001',
    channel,
    status: 'sent',
    provider: channel === 'email' ? 'brevo' : 'meta-whatsapp',
    ...overrides,
  }
}

describe('BookingNotificationPanel', () => {
  it('1. email sent displays correctly', () => {
    render(
      <BookingNotificationPanel
        booking={baseBooking}
        email={makeDelivery('email', { status: 'sent', sentAt: new Date('2026-08-12T10:00:00') })}
        whatsapp={null}
        onResend={vi.fn()}
      />,
    )

    expect(screen.getByText('✓ Sent')).toBeInTheDocument()
    expect(screen.getByText(/Provider: brevo/)).toBeInTheDocument()
  })

  it('2. WhatsApp sent displays correctly', () => {
    render(
      <BookingNotificationPanel
        booking={baseBooking}
        email={null}
        whatsapp={makeDelivery('whatsapp', { status: 'sent' })}
        onResend={vi.fn()}
      />,
    )

    expect(screen.getByText(/Provider: meta-whatsapp/)).toBeInTheDocument()
  })

  it('3. email failed displays retry', () => {
    render(
      <BookingNotificationPanel
        booking={baseBooking}
        email={makeDelivery('email', {
          status: 'failed',
          errorCode: 'sender_not_configured',
        })}
        whatsapp={null}
        onResend={vi.fn()}
      />,
    )

    expect(screen.getByText('✕ Failed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry Email/i })).toBeInTheDocument()
  })

  it('4. WhatsApp failed displays retry', () => {
    render(
      <BookingNotificationPanel
        booking={baseBooking}
        email={null}
        whatsapp={makeDelivery('whatsapp', {
          status: 'failed',
          errorCode: 'provider_error',
        })}
        onResend={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /Retry WhatsApp/i })).toBeInTheDocument()
  })

  it('5. skipped displays reason', () => {
    render(
      <BookingNotificationPanel
        booking={baseBooking}
        email={makeDelivery('email', {
          status: 'skipped',
          skipReason: 'missing_recipient',
        })}
        whatsapp={null}
        onResend={vi.fn()}
      />,
    )

    expect(screen.getByText(/No recipient on file/)).toBeInTheDocument()
  })

  it('6. processing disables retry', () => {
    render(
      <BookingNotificationPanel
        booking={baseBooking}
        email={makeDelivery('email', { status: 'processing' })}
        whatsapp={null}
        onResend={vi.fn()}
      />,
    )

    expect(screen.getByText(/currently processing/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Retry Email/i })).not.toBeInTheDocument()
  })

  it('7. missing notification data handled safely', () => {
    render(
      <BookingNotificationPanel
        booking={baseBooking}
        email={null}
        whatsapp={null}
        onResend={vi.fn()}
      />,
    )

    expect(screen.getAllByText(/No notification data yet/i)).toHaveLength(2)
  })

  it('resend button invokes callback', async () => {
    const user = userEvent.setup()
    const onResend = vi.fn()

    render(
      <BookingNotificationPanel
        booking={baseBooking}
        email={makeDelivery('email', { status: 'failed', errorCode: 'network_error' })}
        whatsapp={null}
        onResend={onResend}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Retry Email/i }))
    expect(onResend).toHaveBeenCalledWith('email')
  })
})
