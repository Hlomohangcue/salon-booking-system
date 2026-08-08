import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  businessInfoSchema,
  type BusinessInfoInput,
  type BusinessInfoOutput,
} from '../settingsValidation'
import { FormField, INPUT_CLASS, INPUT_ERROR_CLASS } from './FormField'
import Button from '../../../../components/ui/Button'
import type { BusinessInfo } from '../types'

interface BusinessSettingsFormProps {
  /** Current business info to pre-populate. */
  defaultValues: BusinessInfo
  /** Called with validated, coerced output on submit. */
  onSubmit: (data: BusinessInfoOutput) => Promise<void>
  /** True while the mutation is in flight — disables submit. */
  submitting?: boolean
}

/**
 * Business / salon identity form.
 *
 * Presentation-only. Validation and persistence happen in the service layer;
 * this component only maps form state to the UI kit and calls `onSubmit`.
 */
export default function BusinessSettingsForm({
  defaultValues,
  onSubmit,
  submitting = false,
}: BusinessSettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessInfoInput, unknown, BusinessInfoOutput>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      salonName: defaultValues.salonName,
      phone: defaultValues.phone,
      email: defaultValues.email,
      address: defaultValues.address,
      logoUrl: defaultValues.logoUrl ?? '',
      timezone: defaultValues.timezone,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Business information form" className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="salonName" label="Salon name" required error={errors.salonName?.message}>
          <input
            {...register('salonName')}
            id="salonName"
            type="text"
            placeholder="e.g. Makeng Salon"
            aria-describedby={errors.salonName ? 'salonName-error' : undefined}
            className={errors.salonName ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField id="phone" label="Phone" required hint="E.164 preferred" error={errors.phone?.message}>
          <input
            {...register('phone')}
            id="phone"
            type="tel"
            placeholder="+266..."
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            className={errors.phone ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField id="email" label="Email" required error={errors.email?.message}>
          <input
            {...register('email')}
            id="email"
            type="email"
            placeholder="hello@makeng.example"
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={errors.email ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField id="timezone" label="Timezone" required error={errors.timezone?.message}>
          <input
            {...register('timezone')}
            id="timezone"
            type="text"
            placeholder="e.g. Africa/Maseru"
            aria-describedby={errors.timezone ? 'timezone-error' : undefined}
            className={errors.timezone ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>
      </div>

      <FormField id="address" label="Address" required error={errors.address?.message}>
        <input
          {...register('address')}
          id="address"
          type="text"
          placeholder="Street, city, country"
          aria-describedby={errors.address ? 'address-error' : undefined}
          className={errors.address ? INPUT_ERROR_CLASS : INPUT_CLASS}
        />
      </FormField>

      <FormField id="logoUrl" label="Logo URL" hint="optional" error={errors.logoUrl?.message}>
        <input
          {...register('logoUrl')}
          id="logoUrl"
          type="url"
          placeholder="https://..."
          aria-describedby={errors.logoUrl ? 'logoUrl-error' : undefined}
          className={errors.logoUrl ? INPUT_ERROR_CLASS : INPUT_CLASS}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Business Info'}
        </Button>
      </div>
    </form>
  )
}
