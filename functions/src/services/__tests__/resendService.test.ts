import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpsError } from 'firebase-functions/v2/https'
import { resendNotification } from '../resendService'
import { createMockDb, MockFirestore } from '../../test/mockFirestore'
import type { BookingSnapshot } from '../../types/notification'
import { NOTIFICATION_ATTEMPTS_SUBCOLLECTION, NOTIFICATION_DELIVERIES_COLLECTION } from '../../types/notification'
import { buildIdempotencyKey } from '../../utils/idempotency'
import type { EmailService } from '../emailService'
import type { WhatsAppService } from '../whatsappService'
import { makeRuntime } from './testHelpers'

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

function makeBooking(overrides: Partial<BookingSnapshot> = {}): BookingSnapshot {
  return {
    bookingId: 'bk-resend-001',
    customerName: 'Amara Nkosi',
    phoneNumber: '+26652000001',
    email: 'amara@example.com',
    serviceId: 'haircut',
    serviceName: 'Haircut',
    serviceDuration: 45,
    servicePrice: 150,
    preferredDate: '2026-08-12',
    preferredTime: '10:00',
    status: 'confirmed',
    source: 'web',
    ...overrides,
  }
}

function seedAdmin(store: MockFirestore, uid = 'admin-1') {
  store.getAllDocs().set(`users/${uid}`, { role: 'admin', email: 'admin@test.com' })
}

function seedBooking(store: MockFirestore, booking: BookingSnapshot) {
  const { bookingId, ...rest } = booking
  store.getAllDocs().set(`bookings/${bookingId}`, { bookingId, ...rest })
}

function seedSettings(store: MockFirestore) {
  store.getAllDocs().set('settings/notifications', {
    emailEnabled: true,
    whatsappEnabled: true,
  })
  store.getAllDocs().set('settings/businessInfo', {
    salonName: 'Makeng Salon',
    phone: '+26652000001',
    timezone: 'Africa/Maseru',
  })
}

function seedExistingDelivery(
  store: MockFirestore,
  bookingId: string,
  channel: 'email' | 'whatsapp',
  status: string,
  extra: Record<string, unknown> = {},
) {
  const deliveryId = buildIdempotencyKey(bookingId, 'confirmation', channel)
  store.getAllDocs().set(`${NOTIFICATION_DELIVERIES_COLLECTION}/${deliveryId}`, {
    deliveryId,
    bookingId,
    channel,
    status,
    provider: channel === 'email' ? 'brevo' : 'meta-whatsapp',
    attempts: 1,
    ...extra,
  })
}

describe('resendNotification', () => {
  let store: MockFirestore
  let db: FirebaseFirestore.Firestore
  let emailService: EmailService
  let whatsappService: WhatsAppService

  beforeEach(() => {
    store = new MockFirestore()
    db = createMockDb(store)
    emailService = {
      sendConfirmationEmail: vi.fn(async () => ({ providerMessageId: 'brevo-resend-1' })),
    }
    whatsappService = {
      sendConfirmationWhatsApp: vi.fn(async () => ({ providerMessageId: 'wamid-resend-1' })),
    }
    seedSettings(store)
  })

  it('8. rejects unauthenticated callers', async () => {
    await expect(
      resendNotification(db, undefined, { bookingId: 'bk-resend-001', channel: 'email' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('9. rejects non-admin callers', async () => {
    store.getAllDocs().set('users/staff-1', { role: 'staff' })
    await expect(
      resendNotification(db, 'staff-1', { bookingId: 'bk-resend-001', channel: 'email' }),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('10. rejects missing booking', async () => {
    seedAdmin(store)
    await expect(
      resendNotification(db, 'admin-1', { bookingId: 'missing', channel: 'email' }),
    ).rejects.toMatchObject({ code: 'not-found' })
  })

  it('11. rejects non-confirmed booking', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking({ status: 'pending' }))
    await expect(
      resendNotification(db, 'admin-1', { bookingId: 'bk-resend-001', channel: 'email' }),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('12. rejects invalid channel', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking())
    await expect(
      resendNotification(db, 'admin-1', {
        bookingId: 'bk-resend-001',
        channel: 'sms' as 'email',
      }),
    ).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('13. confirmed email resend succeeds', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking())
    const runtime = makeRuntime(emailService, whatsappService)

    const result = await resendNotification(
      db,
      'admin-1',
      { bookingId: 'bk-resend-001', channel: 'email' },
      runtime,
    )

    expect(result.status).toBe('sent')
    expect(result.attemptId).toBeTruthy()
    expect(emailService.sendConfirmationEmail).toHaveBeenCalledOnce()
  })

  it('14. confirmed WhatsApp resend succeeds', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking())
    const runtime = makeRuntime(emailService, whatsappService)

    const result = await resendNotification(
      db,
      'admin-1',
      { bookingId: 'bk-resend-001', channel: 'whatsapp' },
      runtime,
    )

    expect(result.status).toBe('sent')
    expect(whatsappService.sendConfirmationWhatsApp).toHaveBeenCalledOnce()
  })

  it('15. missing email rejected safely', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking({ email: undefined }))
    const runtime = makeRuntime(emailService, whatsappService)

    await expect(
      resendNotification(
        db,
        'admin-1',
        { bookingId: 'bk-resend-001', channel: 'email' },
        runtime,
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
    expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled()
  })

  it('16. invalid phone rejected safely', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking({ phoneNumber: '12345' }))
    const runtime = makeRuntime(emailService, whatsappService)

    await expect(
      resendNotification(
        db,
        'admin-1',
        { bookingId: 'bk-resend-001', channel: 'whatsapp' },
        runtime,
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('17. original delivery preserved on resend', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking())
    seedExistingDelivery(store, 'bk-resend-001', 'email', 'sent', {
      providerMessageId: 'original-msg',
      recipient: 'amara@example.com',
    })
    const runtime = makeRuntime(emailService, whatsappService)

    await resendNotification(
      db,
      'admin-1',
      { bookingId: 'bk-resend-001', channel: 'email' },
      runtime,
    )

    const deliveryId = buildIdempotencyKey('bk-resend-001', 'confirmation', 'email')
    const parent = store.getDoc(`${NOTIFICATION_DELIVERIES_COLLECTION}/${deliveryId}`)
    expect(parent?.status).toBe('sent')
    expect(parent?.attempts).toBe(2)
  })

  it('18. resend attempt recorded in attempts subcollection', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking())
    const runtime = makeRuntime(emailService, whatsappService)

    const result = await resendNotification(
      db,
      'admin-1',
      { bookingId: 'bk-resend-001', channel: 'email' },
      runtime,
    )

    const deliveryId = buildIdempotencyKey('bk-resend-001', 'confirmation', 'email')
    const attemptPath = `${NOTIFICATION_DELIVERIES_COLLECTION}/${deliveryId}/${NOTIFICATION_ATTEMPTS_SUBCOLLECTION}/${result.attemptId}`
    const attempt = store.getDoc(attemptPath)
    expect(attempt?.status).toBe('sent')
    expect(attempt?.trigger).toBe('manual_resend')
    expect(attempt?.triggeredByUid).toBe('admin-1')
  })

  it('19. duplicate resend blocked while processing', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking())
    seedExistingDelivery(store, 'bk-resend-001', 'email', 'processing')
    const runtime = makeRuntime(emailService, whatsappService)

    await expect(
      resendNotification(
        db,
        'admin-1',
        { bookingId: 'bk-resend-001', channel: 'email' },
        runtime,
      ),
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('20. client cannot provide arbitrary recipient — server uses booking email', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking({ email: 'server@example.com' }))
    const runtime = makeRuntime(emailService, whatsappService)

    await resendNotification(
      db,
      'admin-1',
      { bookingId: 'bk-resend-001', channel: 'email' },
      runtime,
    )

    expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ toEmail: 'server@example.com' }),
    )
  })

  it('21. client cannot change booking data — content rebuilt from Firestore', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking({ customerName: 'Firestore Name', serviceName: 'Silk Press' }))
    const runtime = makeRuntime(emailService, whatsappService)

    await resendNotification(
      db,
      'admin-1',
      { bookingId: 'bk-resend-001', channel: 'whatsapp' },
      runtime,
    )

    expect(whatsappService.sendConfirmationWhatsApp).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          customerName: 'Firestore Name',
          serviceName: 'Silk Press',
        }),
      }),
    )
  })

  it('22. email failure does not affect WhatsApp resend', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking())
    emailService.sendConfirmationEmail = vi.fn(async () => {
      throw new Error('Brevo down')
    })
    const runtime = makeRuntime(emailService, whatsappService)

    const emailResult = await resendNotification(
      db,
      'admin-1',
      { bookingId: 'bk-resend-001', channel: 'email' },
      runtime,
    )
    const whatsappResult = await resendNotification(
      db,
      'admin-1',
      { bookingId: 'bk-resend-001', channel: 'whatsapp' },
      runtime,
    )

    expect(emailResult.status).toBe('failed')
    expect(whatsappResult.status).toBe('sent')
  })

  it('23. WhatsApp failure does not affect email resend', async () => {
    seedAdmin(store)
    seedBooking(store, makeBooking())
    whatsappService.sendConfirmationWhatsApp = vi.fn(async () => {
      throw new Error('Meta down')
    })
    const runtime = makeRuntime(emailService, whatsappService)

    const emailResult = await resendNotification(
      db,
      'admin-1',
      { bookingId: 'bk-resend-001', channel: 'email' },
      runtime,
    )
    const whatsappResult = await resendNotification(
      db,
      'admin-1',
      { bookingId: 'bk-resend-001', channel: 'whatsapp' },
      runtime,
    )

    expect(emailResult.status).toBe('sent')
    expect(whatsappResult.status).toBe('failed')
  })
})
