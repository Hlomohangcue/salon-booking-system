import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  serviceFormSchema,
  SERVICE_CATEGORY_OPTIONS,
  SERVICE_FORM_DEFAULTS,
  type ServiceFormInput,
  type ServiceFormOutput,
} from '../services/serviceValidation'
import Button from '../../../components/ui/Button'

interface ServiceFormProps {
  /** When provided, the form is in "edit" mode and pre-populates fields. */
  defaultValues?: Partial<ServiceFormOutput>
  /** Called with validated, coerced output on submit. */
  onSubmit: (data: ServiceFormOutput) => Promise<void>
  /** Called to close/cancel the form. */
  onCancel: () => void
  /** True while the mutation is in flight — disables submit. */
  submitting?: boolean
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

const SELECT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition'

/**
 * Reusable service form for create and edit operations.
 *
 * Uses React Hook Form with Zod validation via `@hookform/resolvers`.
 * Fields: Name, Category, Duration, Price, Description, Sort Order, isActive.
 * Strong TypeScript — no `any`.
 */
export default function ServiceForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting = false,
}: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormInput, unknown, ServiceFormOutput>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      ...SERVICE_FORM_DEFAULTS,
      ...defaultValues,
    },
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Service form"
      className="space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="name" label="Name" required error={errors.name?.message}>
          <input
            {...register('name')}
            id="name"
            type="text"
            placeholder="e.g. Haircut"
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={errors.name ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField id="category" label="Category" required error={errors.category?.message}>
          <select
            {...register('category')}
            id="category"
            aria-describedby={errors.category ? 'category-error' : undefined}
            className={SELECT_CLASS}
          >
            {SERVICE_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          id="durationMinutes"
          label="Duration (min)"
          required
          error={errors.durationMinutes?.message}
        >
          <input
            {...register('durationMinutes')}
            id="durationMinutes"
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 45"
            aria-describedby={errors.durationMinutes ? 'durationMinutes-error' : undefined}
            className={errors.durationMinutes ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField
          id="priceFrom"
          label="Price (M)"
          required
          error={errors.priceFrom?.message}
        >
          <input
            {...register('priceFrom')}
            id="priceFrom"
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 150"
            aria-describedby={errors.priceFrom ? 'priceFrom-error' : undefined}
            className={errors.priceFrom ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>

        <FormField
          id="sortOrder"
          label="Sort Order"
          required
          hint="Lower = first"
          error={errors.sortOrder?.message}
        >
          <input
            {...register('sortOrder')}
            id="sortOrder"
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 1"
            aria-describedby={errors.sortOrder ? 'sortOrder-error' : undefined}
            className={errors.sortOrder ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>
      </div>

      <FormField
        id="description"
        label="Description"
        hint="(optional, max 500 chars)"
        error={errors.description?.message}
      >
        <textarea
          {...register('description')}
          id="description"
          rows={3}
          placeholder="Describe what the service includes..."
          aria-describedby={errors.description ? 'description-error' : undefined}
          className={`${errors.description ? INPUT_ERROR_CLASS : INPUT_CLASS} resize-none`}
        />
      </FormField>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          {...register('isActive')}
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-purple-700 focus:ring-purple-600"
        />
        <span className="text-sm font-medium text-gray-700">
          Active (visible to customers)
        </span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Service'}
        </Button>
      </div>
    </form>
  )
}
