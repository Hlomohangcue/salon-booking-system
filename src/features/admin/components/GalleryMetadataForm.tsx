import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  galleryMetadataSchema,
  GALLERY_CATEGORY_OPTIONS,
  GALLERY_METADATA_DEFAULTS,
  type GalleryMetadataInput,
  type GalleryMetadataOutput,
} from '../../gallery/galleryValidation'
import Button from '../../../components/ui/Button'

interface GalleryMetadataFormProps {
  defaultValues?: Partial<GalleryMetadataOutput>
  onSubmit: (data: GalleryMetadataOutput) => Promise<void>
  onCancel: () => void
  submitting?: boolean
  submitLabel?: string
}

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition'

const INPUT_ERROR_CLASS =
  'w-full rounded-lg border border-red-400 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition'

const SELECT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition'

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

/** Metadata form shared by upload and edit dialogs. */
export default function GalleryMetadataForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Save',
}: GalleryMetadataFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GalleryMetadataInput, unknown, GalleryMetadataOutput>({
    resolver: zodResolver(galleryMetadataSchema),
    defaultValues: {
      ...GALLERY_METADATA_DEFAULTS,
      ...defaultValues,
    },
  })

  const isFeatured = watch('isFeatured')

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Gallery metadata form"
      className="space-y-4"
    >
      <FormField id="title" label="Title" required error={errors.title?.message}>
        <input
          {...register('title')}
          id="title"
          type="text"
          placeholder="e.g. Silk press transformation"
          className={errors.title ? INPUT_ERROR_CLASS : INPUT_CLASS}
        />
      </FormField>

      <FormField id="category" label="Category" required error={errors.category?.message}>
        <select {...register('category')} id="category" className={SELECT_CLASS}>
          {GALLERY_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        id="displayOrder"
        label="Display order"
        required
        hint="Lower = first"
        error={errors.displayOrder?.message}
      >
        <input
          {...register('displayOrder')}
          id="displayOrder"
          type="number"
          min={0}
          step={1}
          className={errors.displayOrder ? INPUT_ERROR_CLASS : INPUT_CLASS}
        />
      </FormField>

      <FormField
        id="description"
        label="Description"
        hint="optional"
        error={errors.description?.message}
      >
        <textarea
          {...register('description')}
          id="description"
          rows={2}
          className={`${errors.description ? INPUT_ERROR_CLASS : INPUT_CLASS} resize-none`}
        />
      </FormField>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          {...register('isPublished')}
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-purple-700 focus:ring-purple-600"
        />
        <span className="text-sm font-medium text-gray-700">Published (visible on website)</span>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          {...register('isFeatured')}
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-purple-700 focus:ring-purple-600"
        />
        <span className="text-sm font-medium text-gray-700">Featured (shown first)</span>
      </label>

      {isFeatured && (
        <FormField
          id="featuredUntil"
          label="Featured until"
          hint="optional YYYY-MM-DD"
          error={errors.featuredUntil?.message}
        >
          <input
            {...register('featuredUntil')}
            id="featuredUntil"
            type="date"
            className={errors.featuredUntil ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
        </FormField>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
