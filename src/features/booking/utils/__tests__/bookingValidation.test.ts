import { describe, it, expect } from 'vitest'
import {
  customerNameSchema,
  phoneNumberSchema,
  emailSchema,
  notesSchema,
  serviceIdSchema,
  preferredDateSchema,
  preferredTimeSchema,
  bookingDetailsSchema,
  bookingSelectionSchema,
  bookingFormSchema,
} from '../bookingValidation'

describe('customerNameSchema', () => {
  it('accepts a valid name', () => {
    expect(customerNameSchema.parse('Amara Nkosi')).toBe('Amara Nkosi')
  })

  it('accepts Unicode letters and hyphens and apostrophes', () => {
    expect(customerNameSchema.parse('Thabo M-thebe')).toBe('Thabo M-thebe')
    expect(customerNameSchema.parse("Lerato O'Neil")).toBe("Lerato O'Neil")
  })

  it('rejects names shorter than 2 characters', () => {
    expect(() => customerNameSchema.parse('A')).toThrow()
  })

  it('rejects names longer than 80 characters', () => {
    expect(() => customerNameSchema.parse('A'.repeat(81))).toThrow()
  })

  it('rejects names with invalid characters', () => {
    expect(() => customerNameSchema.parse('Amara 123')).toThrow()
  })
})

describe('phoneNumberSchema', () => {
it('normalises a local number to E.164', () => {
    expect(phoneNumberSchema.parse('52 123 456')).toBe('+26652123456')
  })

  it('accepts an already-normalised +266 number', () => {
    expect(phoneNumberSchema.parse('+26652123456')).toBe('+26652123456')
  })

  it('rejects an invalid Lesotho number', () => {
    expect(() => phoneNumberSchema.parse('123')).toThrow()
  })
})

describe('emailSchema', () => {
  it('accepts a valid email', () => {
    expect(emailSchema.parse('a@b.com')).toBe('a@b.com')
  })

  it('accepts an empty string', () => {
    expect(emailSchema.parse('')).toBe('')
  })

  it('rejects an invalid email', () => {
    expect(() => emailSchema.parse('not-an-email')).toThrow()
  })
})

describe('notesSchema', () => {
  it('accepts optional notes', () => {
    expect(notesSchema.parse('Please call on arrival')).toBe('Please call on arrival')
  })

  it('accepts undefined', () => {
    expect(notesSchema.parse(undefined)).toBeUndefined()
  })

  it('rejects notes longer than 500 characters', () => {
    expect(() => notesSchema.parse('x'.repeat(501))).toThrow()
  })
})

describe('serviceIdSchema', () => {
  it('requires a non-empty service id', () => {
    expect(() => serviceIdSchema.parse('')).toThrow()
    expect(serviceIdSchema.parse('svc-1')).toBe('svc-1')
  })
})

describe('preferredDateSchema', () => {
  it('validates the ISO date format', () => {
    expect(preferredDateSchema.parse('2026-08-05')).toBe('2026-08-05')
    expect(() => preferredDateSchema.parse('05/08/2026')).toThrow()
  })
})

describe('preferredTimeSchema', () => {
  it('validates the HH:MM format', () => {
    expect(preferredTimeSchema.parse('09:30')).toBe('09:30')
    expect(() => preferredTimeSchema.parse('9:30')).toThrow()
  })
})

describe('bookingDetailsSchema', () => {
  it('parses valid details and normalises the phone', () => {
const result = bookingDetailsSchema.parse({
      customerName: 'Amara',
      phoneNumber: '52 123 456',
      email: 'a@b.com',
      notes: '',
    })
    expect(result.phoneNumber).toBe('+26652123456')
    expect(result.customerName).toBe('Amara')
  })

  it('rejects invalid details', () => {
    expect(() =>
      bookingDetailsSchema.parse({
        customerName: 'A',
        phoneNumber: '123',
        email: 'bad',
        notes: '',
      }),
    ).toThrow()
  })
})

describe('bookingSelectionSchema', () => {
  it('parses a valid selection', () => {
    const result = bookingSelectionSchema.parse({
      serviceId: 'svc-1',
      preferredDate: '2026-08-05',
      preferredTime: '09:30',
    })
    expect(result.serviceId).toBe('svc-1')
  })

  it('rejects an invalid selection', () => {
    expect(() =>
      bookingSelectionSchema.parse({
        serviceId: '',
        preferredDate: 'bad',
        preferredTime: 'bad',
      }),
    ).toThrow()
  })
})

describe('bookingFormSchema', () => {
  it('parses a full valid form', () => {
    const result = bookingFormSchema.parse({
      customerName: 'Amara Nkosi',
      phoneNumber: '52123456',
      email: 'a@b.com',
      notes: '',
      serviceId: 'svc-1',
      preferredDate: '2026-08-05',
      preferredTime: '09:30',
    })
    expect(result.phoneNumber).toBe('+26652123456')
  })

  it('rejects an invalid form', () => {
    expect(() =>
      bookingFormSchema.parse({
        customerName: '',
        phoneNumber: '',
        serviceId: '',
        preferredDate: '',
        preferredTime: '',
      }),
).toThrow()
  })
})
