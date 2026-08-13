import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotificationSettingsForm from '../components/NotificationSettingsForm'

describe('NotificationSettingsForm', () => {
  it('24. admin can enable email', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(data: { emailEnabled: boolean; whatsappEnabled: boolean }) => Promise<void>>(
      async () => {},
    )

    render(
      <NotificationSettingsForm
        defaultValues={{
          emailEnabled: false,
          whatsappEnabled: false,
          smsPlaceholder: '',
          whatsappPlaceholder: '',
        }}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByLabelText(/Email confirmations/i))
    await user.click(screen.getByRole('button', { name: /Save Notification Settings/i }))

    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ emailEnabled: true })
  })

  it('25. admin can disable email', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(data: { emailEnabled: boolean; whatsappEnabled: boolean }) => Promise<void>>(
      async () => {},
    )

    render(
      <NotificationSettingsForm
        defaultValues={{
          emailEnabled: true,
          whatsappEnabled: false,
          smsPlaceholder: '',
          whatsappPlaceholder: '',
        }}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByLabelText(/Email confirmations/i))
    await user.click(screen.getByRole('button', { name: /Save Notification Settings/i }))

    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ emailEnabled: false })
  })

  it('26. admin can enable WhatsApp', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(data: { emailEnabled: boolean; whatsappEnabled: boolean }) => Promise<void>>(
      async () => {},
    )

    render(
      <NotificationSettingsForm
        defaultValues={{
          emailEnabled: false,
          whatsappEnabled: false,
          smsPlaceholder: '',
          whatsappPlaceholder: '',
        }}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByLabelText(/WhatsApp confirmations/i))
    await user.click(screen.getByRole('button', { name: /Save Notification Settings/i }))

    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ whatsappEnabled: true })
  })

  it('27. admin can disable WhatsApp', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(data: { emailEnabled: boolean; whatsappEnabled: boolean }) => Promise<void>>(
      async () => {},
    )

    render(
      <NotificationSettingsForm
        defaultValues={{
          emailEnabled: false,
          whatsappEnabled: true,
          smsPlaceholder: '',
          whatsappPlaceholder: '',
        }}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByLabelText(/WhatsApp confirmations/i))
    await user.click(screen.getByRole('button', { name: /Save Notification Settings/i }))

    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ whatsappEnabled: false })
  })
})
