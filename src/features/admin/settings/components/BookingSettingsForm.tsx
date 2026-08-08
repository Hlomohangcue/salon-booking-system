import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  bookingSettingsSchema,
  type BookingSettingsInput,
  type BookingSettingsOutput,
} from '../settingsValidation'
import { FormField, INPUT_CLASS, INPUT_ERROR_CLASS } from './FormField'
import WorkingHoursEditor from './WorkingHoursEditor'
import HolidayManager, { type HolidayRow } from './HolidayManager'
import Button from '../../../../components/ui/Button'
import type { SettingsBookingConfig } from '../types'

interface BookingSettingsFormProps {
  /** Current booking config to pre-populate. */
  defaultValues: SettingsBookingConfig
  /** Called with validated, coerced output on submit. */
  onSubmit: (data: SettingsBookingConfig) => Promise<void>
  /** True while the mutation is in flight. */
  submitting?: boolean
}

/**
 * Booking settings form.
 *
 * Presentation-only. Composes the working-hours editor, holiday manager, and
 * numeric/string fields into a single form submission.
 */
export default function BookingSettingsForm({
  defaultValues,
  onSubmit,
  submitting = false,
}: BookingSettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingSettingsInput, unknown, BookingSettingsOutput>({
    resolver: zodResolver(bookingSettingsSchema),
    defaultValues: {
      slotIntervalMins: defaultValues.slotIntervalMins,
      bookingWindowDays: defaultValues.bookingWindowDays,
      minAdvanceHours: defaultValues.minAdvanceHours,
      maxBookingsPerSlot: defaultValues.maxBookingsPerSlot,
      bufferBetweenAppointmentsMins: defaultValues.bufferBetweenAppointmentsMins,
      maxBookingsPerDay: defaultValues.maxBookingsPerDay,
      sameDayCutoffTime: defaultValues.sameDayCutoffTime ?? '',
    },
  })

  const [workingHours, setWorkingHours] = useState(defaultValues.workingHours)
  const [holidays, setHolidays] = useState<HolidayRow[]>(
    defaultValues.holidays.map((d) => ({ date: d, name: d, recurring: false })),
  )

  const handleFormSubmit = useCallback(
    async (data: BookingSettingsOutput) => {
      await onSubmit({
        workingHours,
        slotIntervalMins: data.slotIntervalMins,
        bookingWindowDays: data.bookingWindowDays,
        minAdvanceHours: data.minAdvanceHours,
        maxBookingsPerSlot: data.maxBookingsPerSlot,
        holidays: holidays.map((h) => h.date),
        bufferBetweenAppointmentsMins: data.bufferBetweenAppointmentsMins,
        maxBookingsPerDay: data.maxBookingsPerDay,
        sameDayCutoffTime: data.sameDayCutoffTime || undefined,
      })
    },
    [onSubmit, workingHours, holidays],
  )

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate aria-label="Booking settings form" className="space-y-6">
      {/* Working hours */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-900 mb-3">Working Hours</legend>
        <WorkingHoursEditor value={workingHours} onChange={setWorkingHours} disabled={submitting} />
      </fieldset>

      {/* Numeric fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormField id="slotIntervalMins" label="Slot interval (min)" required error={errors.slotIntervalMins?.message}>
          <input
            {...register('slotIntervalMins')}
            id="slotIntervalMins"
            type="number"
            min={5}
            max={240}
            step={1}
            aria-describedby={errors.slotIntervalMins ? 'slotIntervalMins-error' : undefined}
            className={errors.slotIntervalMins ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField id="bookingWindowDays" label="Booking window (days)" required error={errors.bookingWindowDays?.message}>
          <input
            {...register('bookingWindowDays')}
            id="bookingWindowDays"
            type="number"
            min={1}
            max={365}
            step={1}
            aria-describedby={errors.bookingWindowDays ? 'bookingWindowDays-error' : undefined}
            className={errors.bookingWindowDays ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField id="minAdvanceHours" label="Lead time (hours)" required error={errors.minAdvanceHours?.message}>
          <input
            {...register('minAdvanceHours')}
            id="minAdvanceHours"
            type="number"
            min={0}
            max={168}
            step={1}
            aria-describedby={errors.minAdvanceHours ? 'minAdvanceHours-error' : undefined}
            className={errors.minAdvanceHours ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField id="maxBookingsPerSlot" label="Max per slot" required error={errors.maxBookingsPerSlot?.message}>
          <input
            {...register('maxBookingsPerSlot')}
            id="maxBookingsPerSlot"
            type="number"
            min={1}
            max={20}
            step={1}
            aria-describedby={errors.maxBookingsPerSlot ? 'maxBookingsPerSlot-error' : undefined}
            className={errors.maxBookingsPerSlot ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>
      </div>

      {/* Future constraint fields (stored but not yet wired into engine) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          id="bufferBetweenAppointmentsMins"
          label="Buffer (min)"
          hint="Future — not yet enforced"
          error={errors.bufferBetweenAppointmentsMins?.message}
        >
          <input
            {...register('bufferBetweenAppointmentsMins')}
            id="bufferBetweenAppointmentsMins"
            type="number"
            min={0}
            max={480}
            step={1}
            placeholder="e.g. 15"
            aria-describedby={errors.bufferBetweenAppointmentsMins ? 'bufferBetweenAppointmentsMins-error' : undefined}
            className={errors.bufferBetweenAppointmentsMins ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField
          id="maxBookingsPerDay"
          label="Max bookings/day"
          hint="Future — not yet enforced"
          error={errors.maxBookingsPerDay?.message}
        >
          <input
            {...register('maxBookingsPerDay')}
            id="maxBookingsPerDay"
            type="number"
            min={1}
            max={1000}
            step={1}
            placeholder="e.g. 20"
            aria-describedby={errors.maxBookingsPerDay ? 'maxBookingsPerDay-error' : undefined}
            className={errors.maxBookingsPerDay ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField
          id="sameDayCutoffTime"
          label="Same-day cutoff"
          hint="HH:MM — future, not yet enforced"
          error={errors.sameDayCutoffTime?.message}
        >
          <input
            {...register('sameDayCutoffTime')}
            id="sameDayCutoffTime"
            type="time"
            aria-describedby={errors.sameDayCutoffTime ? 'sameDayCutoffTime-error' : undefined}
            className={errors.sameDayCutoffTime ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>
      </div>

      {/* Holidays */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-900 mb-3">Holidays / Closed Days</legend>
        <HolidayManager holidays={holidays} onChange={setHolidays} disabled={submitting} />
      </fieldset>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Booking Settings'}
        </Button>
      </div>
    </form>
  )
}
