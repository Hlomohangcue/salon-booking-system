import { z } from 'zod'
import { normalizePhone } from './dateHelpers'

// Lesotho E.164: country code 266 + 8 digits (first digit 2–8 covers mobile and landline)
const LESOTHO_PHONE_REGEX = /^\+266[2-8]\d{7}$/

// Unicode letter class — supports Sesotho and other local name characters
const NAME_REGEX = /^[\p{L}\s'-]+$/u

// ─── Individual field schemas ───────────────────────────────────────────────

export const customerNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name must be 80 characters or fewer')
  .regex(NAME_REGEX, "Name may only contain letters, spaces, hyphens, and apostrophes")

/**
 * Phone validation pipeline:
 * 1. normalizePhone() converts local formats to E.164 (+266XXXXXXXX)
 * 2. Regex validates the normalised result
 */
export const phoneNumberSchema = z
  .string()
  .min(1, 'Phone number is required')
  .transform(normalizePhone)
  .pipe(z.string().regex(LESOTHO_PHONE_REGEX, 'Enter a valid Lesotho number (+266XXXXXXXX)'))

/** Email is optional — empty string is treated as no email */
export const emailSchema = z
  .string()
  .email('Enter a valid email address')
  .optional()
  .or(z.literal(''))

export const notesSchema = z
  .string()
  .max(500, 'Notes must be 500 characters or fewer')
  .optional()

export const serviceIdSchema = z.string().min(1, 'Please select a service')

export const preferredDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)')

export const preferredTimeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Invalid time format (expected HH:MM)')

// ─── Composite schemas ──────────────────────────────────────────────────────

/** Validates customer personal details (wizard step 4) */
export const bookingDetailsSchema = z.object({
  customerName: customerNameSchema,
  phoneNumber: phoneNumberSchema,
  email: emailSchema,
  notes: notesSchema,
})

/** Validates service, date, and time selection (wizard steps 1–3) */
export const bookingSelectionSchema = z.object({
  serviceId: serviceIdSchema,
  preferredDate: preferredDateSchema,
  preferredTime: preferredTimeSchema,
})

/**
 * Full booking form schema for use with @hookform/resolvers/zod in Phase 3.2.
 *
 * Input type  = BookingFormInput  (raw form values, phoneNumber as user typed it)
 * Output type = BookingFormOutput (phoneNumber normalised to E.164)
 */
export const bookingFormSchema = z.object({
  customerName: customerNameSchema,
  phoneNumber: phoneNumberSchema,
  email: emailSchema,
  notes: notesSchema,
  serviceId: serviceIdSchema,
  preferredDate: preferredDateSchema,
  preferredTime: preferredTimeSchema,
})

// ─── Inferred types ─────────────────────────────────────────────────────────

export type BookingDetailsInput = z.input<typeof bookingDetailsSchema>
export type BookingDetailsOutput = z.output<typeof bookingDetailsSchema>
export type BookingFormInput = z.input<typeof bookingFormSchema>
export type BookingFormOutput = z.output<typeof bookingFormSchema>
