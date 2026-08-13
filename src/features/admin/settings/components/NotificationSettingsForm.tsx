import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  notificationSettingsSchema,
  type NotificationSettingsInput,
  type NotificationSettingsOutput,
} from '../settingsValidation'
import { CHECKBOX_CLASS } from './FormField'
import Button from '../../../../components/ui/Button'
import type { NotificationSettings } from '../types'

interface NotificationSettingsFormProps {
  /** Current notification settings to pre-populate. */
  defaultValues: NotificationSettings
  /** Called with validated, coerced output on submit. */
  onSubmit: (data: NotificationSettingsOutput) => Promise<void>
  /** True while the mutation is in flight. */
  submitting?: boolean
}

/**
 * Notification settings form — email and WhatsApp confirmation toggles.
 * Provider secrets are configured server-side only.
 */
export default function NotificationSettingsForm({
  defaultValues,
  onSubmit,
  submitting = false,
}: NotificationSettingsFormProps) {
  const {
    register,
    handleSubmit,
  } = useForm<NotificationSettingsInput, unknown, NotificationSettingsOutput>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailEnabled: defaultValues.emailEnabled,
      whatsappEnabled: defaultValues.whatsappEnabled,
      smsPlaceholder: defaultValues.smsPlaceholder,
      whatsappPlaceholder: defaultValues.whatsappPlaceholder,
    },
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Notification settings form"
      className="space-y-4"
    >
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          {...register('emailEnabled')}
          type="checkbox"
          className={CHECKBOX_CLASS}
        />
        <span className="text-sm font-medium text-gray-700">Email confirmations</span>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          {...register('whatsappEnabled')}
          type="checkbox"
          className={CHECKBOX_CLASS}
        />
        <span className="text-sm font-medium text-gray-700">WhatsApp confirmations</span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </div>
    </form>
  )
}
