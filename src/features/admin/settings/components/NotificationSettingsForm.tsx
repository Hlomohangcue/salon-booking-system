import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  notificationSettingsSchema,
  type NotificationSettingsInput,
  type NotificationSettingsOutput,
} from '../settingsValidation'
import { FormField, INPUT_CLASS, INPUT_ERROR_CLASS, CHECKBOX_CLASS } from './FormField'
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
 * Notification settings form.
 *
 * Email toggles are active. SMS and WhatsApp are configuration placeholders
 * reserved for future provider integrations — they are stored but have no
 * runtime effect yet.
 */
export default function NotificationSettingsForm({
  defaultValues,
  onSubmit,
  submitting = false,
}: NotificationSettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NotificationSettingsInput, unknown, NotificationSettingsOutput>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailEnabled: defaultValues.emailEnabled,
      smsPlaceholder: defaultValues.smsPlaceholder,
      whatsappPlaceholder: defaultValues.whatsappPlaceholder,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Notification settings form" className="space-y-5">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          {...register('emailEnabled')}
          type="checkbox"
          className={CHECKBOX_CLASS}
        />
        <span className="text-sm font-medium text-gray-700">Enable email notifications</span>
      </label>

      <FormField id="smsPlaceholder" label="SMS provider key" hint="placeholder — future SMS integration" error={errors.smsPlaceholder?.message}>
        <input
          {...register('smsPlaceholder')}
          id="smsPlaceholder"
          type="text"
          placeholder="Reserved for SMS provider"
          aria-describedby={errors.smsPlaceholder ? 'smsPlaceholder-error' : undefined}
          className={errors.smsPlaceholder ? INPUT_ERROR_CLASS : INPUT_CLASS}
        />
      </FormField>

      <FormField id="whatsappPlaceholder" label="WhatsApp provider key" hint="placeholder — future WhatsApp integration" error={errors.whatsappPlaceholder?.message}>
        <input
          {...register('whatsappPlaceholder')}
          id="whatsappPlaceholder"
          type="text"
          placeholder="Reserved for WhatsApp integration"
          aria-describedby={errors.whatsappPlaceholder ? 'whatsappPlaceholder-error' : undefined}
          className={errors.whatsappPlaceholder ? INPUT_ERROR_CLASS : INPUT_CLASS}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </div>
    </form>
  )
}
