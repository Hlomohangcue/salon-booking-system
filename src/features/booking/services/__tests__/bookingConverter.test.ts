import { describe, it, expect } from 'vitest'
import { fromFirestore, bookingConverter } from '../bookingConverter'
import { makeBookingDocument, makeTimestamp } from '../../../../test/fixtures/booking'

describe('fromFirestore', () => {
  it('converts Timestamp fields to Date objects', () => {
    const createdAt = new Date('2026-08-05T10:00:00.000Z')
    const updatedAt = new Date('2026-08-06T11:30:00.000Z')
    const doc = makeBookingDocument({
      createdAt: makeTimestamp(createdAt),
      updatedAt: makeTimestamp(updatedAt),
    })
    const booking = fromFirestore(doc)
    expect(booking.createdAt).toBeInstanceOf(Date)
    expect(booking.createdAt.getTime()).toBe(createdAt.getTime())
    expect(booking.updatedAt.getTime()).toBe(updatedAt.getTime())
  })

  it('converts completedAt and preserves undefined optional fields', () => {
    const completedAt = new Date('2026-08-05T09:30:00.000Z')
    const doc = makeBookingDocument({
      completedAt: makeTimestamp(completedAt),
      confirmedAt: undefined,
      cancelledAt: undefined,
    })
    const booking = fromFirestore(doc)
    expect(booking.completedAt?.getTime()).toBe(completedAt.getTime())
    expect(booking.confirmedAt).toBeUndefined()
    expect(booking.cancelledAt).toBeUndefined()
  })

  it('preserves primitive fields', () => {
    const doc = makeBookingDocument({ preferredDate: '2026-08-05', preferredTime: '09:00' })
    const booking = fromFirestore(doc)
    expect(booking.preferredDate).toBe('2026-08-05')
    expect(booking.preferredTime).toBe('09:00')
    expect(booking.phoneNumber).toBe(doc.phoneNumber)
    expect(booking.status).toBe(doc.status)
  })
})

describe('bookingConverter', () => {
  it('toFirestore returns the booking payload as a plain object', () => {
    const booking = {
      bookingId: 'bk-1',
      customerName: 'Amara',
      preferredDate: '2026-08-05',
    }
    const result = bookingConverter.toFirestore(booking)
    expect(result).toEqual(booking)
  })

  it('fromFirestore converts a snapshot data to a Booking', () => {
    const createdAt = new Date('2026-08-05T10:00:00.000Z')
    const doc = makeBookingDocument({ createdAt: makeTimestamp(createdAt) })
    const snapshot = {
      data: () => doc,
    }
    const booking = bookingConverter.fromFirestore(snapshot as never)
    expect(booking.createdAt).toBeInstanceOf(Date)
    expect(booking.bookingId).toBe(doc.bookingId)
  })
})
