import { z } from 'zod'
import type { ServiceCategory } from '../../booking/types'

/**
 * The full set of service categories. Kept as a const array so the customer
 * booking model (`ServiceCategory` in features/booking/types.ts) remains the
 * single source of truth for the union, while the admin form derives its
 * selectable options and labels from this list.
 */
export const SERVICE_CATEGORY_OPTIONS: readonly { value: ServiceCategory; label: string }[] = [
  { value: 'hair', label: 'Hair' },
  { value: 'beard', label: 'Beard' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'treatment', label: 'Treatment' },
] as const

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  hair: 'Hair',
  beard: 'Beard',
  makeup: 'Makeup',
  treatment: 'Treatment',
}

/**
 * Zod schema for the service form (create + edit).
 *
 * Field rules (per Phase 3.3 requirements):
 *  - name        — required
 *  - category    — required, must be a known ServiceCategory
 *  - durationMinutes — integer > 0
 *  - priceFrom   — number >= 0
 *  - description — optional, max length enforced
 *  - sortOrder   — integer >= 0
 *  - isActive    — boolean
 */
export const serviceFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(80, 'Name must be 80 characters or fewer'),
  category: z.enum(['hair', 'beard', 'makeup', 'treatment'], {
    error: 'Category is required',
  }),
  durationMinutes: z.coerce
    .number({ error: 'Duration is required' })
    .int('Duration must be a whole number')
    .positive('Duration must be greater than 0'),
  priceFrom: z.coerce
    .number({ error: 'Price is required' })
    .nonnegative('Price must be 0 or greater'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or fewer')
    .optional()
    .default(''),
  sortOrder: z.coerce
    .number({ error: 'Sort order is required' })
    .int('Sort order must be a whole number')
    .nonnegative('Sort order must be 0 or greater'),
  isActive: z.boolean(),
})

/** Input type = raw form values before coercion. */
export type ServiceFormInput = z.input<typeof serviceFormSchema>

/** Output type = validated, coerced form values. */
export type ServiceFormOutput = z.output<typeof serviceFormSchema>

/** Default values used when opening the "Create Service" form. */
export const SERVICE_FORM_DEFAULTS: ServiceFormOutput = {
  name: '',
  category: 'hair',
  durationMinutes: 30,
  priceFrom: 0,
  description: '',
  sortOrder: 0,
  isActive: true,
}

