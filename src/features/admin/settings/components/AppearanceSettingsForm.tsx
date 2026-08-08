import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  appearanceSettingsSchema,
  THEME_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  type AppearanceSettingsInput,
  type AppearanceSettingsOutput,
} from '../settingsValidation'
import { FormField, INPUT_CLASS, INPUT_ERROR_CLASS, SELECT_CLASS } from './FormField'
import Button from '../../../../components/ui/Button'
import type { AppearanceSettings } from '../types'

interface AppearanceSettingsFormProps {
  /** Current appearance preferences to pre-populate. */
  defaultValues: AppearanceSettings
  /** Called with validated, coerced output on submit. */
  onSubmit: (data: AppearanceSettingsOutput) => Promise<void>
  /** True while the mutation is in flight. */
  submitting?: boolean
}

/**
 * Appearance / display preferences form.
 *
 * Presentation-only. Currency, theme, and date/time format preferences are
 * validated with Zod and persisted upstream.
 */
export default function AppearanceSettingsForm({
  defaultValues,
  onSubmit,
  submitting = false,
}: AppearanceSettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppearanceSettingsInput, unknown, AppearanceSettingsOutput>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: {
      currency: defaultValues.currency,
      theme: defaultValues.theme,
      dateFormat: defaultValues.dateFormat,
      timeFormat: defaultValues.timeFormat,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Appearance settings form" className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="currency" label="Currency" required hint="e.g. M for Lesotho loti" error={errors.currency?.message}>
          <input
            {...register('currency')}
            id="currency"
            type="text"
            placeholder="M"
            aria-describedby={errors.currency ? 'currency-error' : undefined}
            className={errors.currency ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField id="theme" label="Theme" required error={errors.theme?.message}>
          <select
            {...register('theme')}
            id="theme"
            aria-describedby={errors.theme ? 'theme-error' : undefined}
            className={SELECT_CLASS}
          >
            {THEME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="dateFormat" label="Date format" required error={errors.dateFormat?.message}>
          <select
            {...register('dateFormat')}
            id="dateFormat"
            aria-describedby={errors.dateFormat ? 'dateFormat-error' : undefined}
            className={SELECT_CLASS}
          >
            {DATE_FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="timeFormat" label="Time format" required error={errors.timeFormat?.message}>
          <select
            {...register('timeFormat')}
            id="timeFormat"
            aria-describedby={errors.timeFormat ? 'timeFormat-error' : undefined}
            className={SELECT_CLASS}
          >
            {TIME_FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Appearance Settings'}
        </Button>
      </div>
    </form>
  )
}
