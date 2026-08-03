import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  bookingDetailsSchema,
  type BookingDetailsInput,
  type BookingDetailsOutput,
} from '../../utils/bookingValidation'
import Button from '../../../../components/ui/Button'

interface DetailsStepProps {
  initialValues: {
    customerName: string
    phoneNumber: string
    email: string
    notes: string
  }
  onSubmit: (details: BookingDetailsOutput) => void
  onBack: () => void
}

interface FieldProps {
  id: string
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

function FormField({ id, label, error, required, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1 text-xs">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition'

const INPUT_ERROR_CLASS =
  'w-full rounded-lg border border-red-400 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition'

export default function DetailsStep({ initialValues, onSubmit, onBack }: DetailsStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingDetailsInput, unknown, BookingDetailsOutput>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: {
      customerName: initialValues.customerName,
      phoneNumber: initialValues.phoneNumber,
      email: initialValues.email,
      notes: initialValues.notes,
    },
  })

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-gray-900 mb-1">Your Details</h2>
      <p className="text-gray-500 text-sm mb-6">We just need a few details to confirm your booking.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Customer details form">
        <div className="space-y-5 mb-8">
          <FormField id="customerName" label="Full Name" required error={errors.customerName?.message}>
            <input
              {...register('customerName')}
              id="customerName"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              aria-describedby={errors.customerName ? 'customerName-error' : undefined}
              className={errors.customerName ? INPUT_ERROR_CLASS : INPUT_CLASS}
            />
          </FormField>

          <FormField
            id="phoneNumber"
            label="Phone Number"
            required
            hint="(Lesotho: +266XXXXXXXX or 52123456)"
            error={errors.phoneNumber?.message}
          >
            <input
              {...register('phoneNumber')}
              id="phoneNumber"
              type="tel"
              autoComplete="tel"
              placeholder="+26652123456"
              aria-describedby={errors.phoneNumber ? 'phoneNumber-error' : undefined}
              className={errors.phoneNumber ? INPUT_ERROR_CLASS : INPUT_CLASS}
            />
          </FormField>

          <FormField
            id="email"
            label="Email Address"
            hint="(optional)"
            error={errors.email?.message}
          >
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="jane@example.com"
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={errors.email ? INPUT_ERROR_CLASS : INPUT_CLASS}
            />
          </FormField>

          <FormField id="notes" label="Notes" hint="(optional)" error={errors.notes?.message}>
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              placeholder="Any special requests or information for the stylist..."
              aria-describedby={errors.notes ? 'notes-error' : undefined}
              className={`${errors.notes ? INPUT_ERROR_CLASS : INPUT_CLASS} resize-none`}
            />
          </FormField>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Review Booking
          </Button>
        </div>
      </form>
    </div>
  )
}
