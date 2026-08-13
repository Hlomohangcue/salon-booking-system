import { z } from 'zod'
import type { GalleryCategory } from './types'

export const GALLERY_CATEGORY_OPTIONS: readonly { value: GalleryCategory; label: string }[] = [
  { value: 'hair', label: 'Hair' },
  { value: 'beard', label: 'Beard' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'other', label: 'Other' },
] as const

export const GALLERY_CATEGORY_LABELS: Record<GalleryCategory, string> = {
  hair: 'Hair',
  beard: 'Beard',
  makeup: 'Makeup',
  treatment: 'Treatment',
  other: 'Other',
}

/** ISO date "YYYY-MM-DD" for optional featured-until date. */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/** Metadata form schema (create/edit — image handled separately). */
export const galleryMetadataSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(120, 'Title must be 120 characters or fewer'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or fewer')
    .optional()
    .default(''),
  category: z.enum(['hair', 'beard', 'makeup', 'treatment', 'other'], {
    error: 'Category is required',
  }),
  displayOrder: z.coerce
    .number({ error: 'Display order is required' })
    .int('Display order must be a whole number')
    .nonnegative('Display order must be 0 or greater'),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  featuredUntil: z
    .string()
    .regex(DATE_REGEX, 'Use YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
})

export type GalleryMetadataInput = z.input<typeof galleryMetadataSchema>
export type GalleryMetadataOutput = z.output<typeof galleryMetadataSchema>

export const GALLERY_METADATA_DEFAULTS: GalleryMetadataOutput = {
  title: '',
  description: '',
  category: 'hair',
  displayOrder: 0,
  isPublished: false,
  isFeatured: false,
  featuredUntil: '',
}
