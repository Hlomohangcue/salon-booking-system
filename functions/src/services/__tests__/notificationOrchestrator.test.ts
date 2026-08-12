import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  dispatchConfirmationNotifications,
  dispatchEmailChannel,
  dispatchWhatsappChannel,
  handleBookingUpdated,
} from '../../services/notificationOrchestrator'
import { createDeliveryIfAbsent } from '../../services/deliveryRepository'
import { createMockDb, MockFirestore } from '../../test/mockFirestore'
import type { BookingSnapshot } from '../../types/notification'
import { NOTIFICATION_DELIVERIES_COLLECTION } from '../../types/notification'
import { buildIdempotencyKey } from '../../utils/idempotency'
import type { EmailService } from '../../services/emailService'
import type { WhatsAppService } from '../../services/whatsappService'
import { buildConfirmationEmail } from '../../templates/confirmationEmail'
import { buildConfirmationWhatsAppTemplate } from '../../templates/confirmationWhatsApp'
import { createBrevoEmailService } from '../../services/emailService'
import { createMetaWhatsAppService } from '../../services/whatsappService'
import { EmailServiceError } from '../../utils/emailErrors'
import { WhatsAppServiceError } from '../../utils/whatsappErrors'

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

const mockSettingsReader = {
  getBusinessInfo: vi.fn(async () => ({
    salonName: 'Makeng Salon',
    phone: '+26652000001',
    email: 'hello@makeng.test',
    address: '123 Main St, Maseru',
    timezone: 'Africa/Maseru',
  })),
  getNotificationSettings: vi.fn(async () => ({
    emailEnabled: true,
    whatsappEnabled: true,
  })),
}

const defaultWhatsappConfig = {
  phoneNumberId: '123456789',
  templateName: 'appointment_confirmation',
  templateLanguage: 'en',
  apiVersion: 'v21.0',
}

function makeRuntime(emailService: EmailService, whatsappService?: WhatsAppService) {
  return {
    emailService,
    emailConfig: { fromEmail: 'bookings@makeng.test', fromName: 'Makeng Salon' },
    whatsappService: whatsappService ?? successWhatsappService(),
    whatsappConfig: defaultWhatsappConfig,
  }
}

function makeBooking(overrides: Partial<BookingSnapshot> = {}): BookingSnapshot {
  return {
    bookingId: 'bk-test-001',
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

function makeBookingDoc(booking: BookingSnapshot): Record<string, unknown> {
  return { ...booking }
}

function successEmailService(messageId = 'brevo-msg-123'): EmailService {
  return {
    sendConfirmationEmail: vi.fn(async () => ({ providerMessageId: messageId })),
  }
}

function failingEmailService(error: Error): EmailService {
  return {
    sendConfirmationEmail: vi.fn(async () => {
      throw error
    }),
  }
}

function successWhatsappService(messageId = 'wamid.test123'): WhatsAppService {
  return {
    sendConfirmationWhatsApp: vi.fn(async () => ({ providerMessageId: messageId })),
  }
}

function failingWhatsappService(error: Error): WhatsAppService {
  return {
    sendConfirmationWhatsApp: vi.fn(async () => {
      throw error
    }),
  }
}

function makePayload(booking: BookingSnapshot) {
  return {
    bookingId: booking.bookingId,
    customerName: booking.customerName,
    phoneNumber: booking.phoneNumber,
    email: booking.email,
    serviceName: booking.serviceName,
    serviceDuration: booking.serviceDuration,
    servicePrice: booking.servicePrice,
    preferredDate: booking.preferredDate,
    preferredTime: booking.preferredTime,
  }
}

describe('handleBookingUpdated', () => {
  let store: MockFirestore
  let db: FirebaseFirestore.Firestore

  beforeEach(() => {
    store = new MockFirestore()
    db = createMockDb(store)
    vi.clearAllMocks()
    mockSettingsReader.getNotificationSettings.mockResolvedValue({
      emailEnabled: true,
      whatsappEnabled: true,
    })
  })

  it('1. pending → confirmed creates email and WhatsApp deliveries', async () => {
    const booking = makeBooking()
    const result = await handleBookingUpdated(
      db,
      {
        bookingId: booking.bookingId,
        before: makeBookingDoc({ ...booking, status: 'pending' }),
        after: makeBookingDoc(booking),
      },
      mockSettingsReader,
      makeRuntime(successEmailService()),
    )

    expect(result).not.toBeNull()
    expect(result!.channels).toHaveLength(2)

    const emailKey = buildIdempotencyKey(booking.bookingId, 'confirmation', 'email')
    const whatsappKey = buildIdempotencyKey(booking.bookingId, 'confirmation', 'whatsapp')

    expect(store.getDoc(`${NOTIFICATION_DELIVERIES_COLLECTION}/${emailKey}`)?.status).toBe('sent')
    expect(store.getDoc(`${NOTIFICATION_DELIVERIES_COLLECTION}/${whatsappKey}`)?.status).toBe(
      'sent',
    )
  })

  it('2. pending → confirmed with empty email skips email and creates WhatsApp', async () => {
    const booking = makeBooking({ email: '' })
    const result = await handleBookingUpdated(
      db,
      {
        bookingId: booking.bookingId,
        before: makeBookingDoc({ ...booking, status: 'pending' }),
        after: makeBookingDoc(booking),
      },
      mockSettingsReader,
      makeRuntime(successEmailService()),
    )

    const email = result!.channels.find((c) => c.channel === 'email')
    const whatsapp = result!.channels.find((c) => c.channel === 'whatsapp')

    expect(email?.status).toBe('skipped')
    expect(email?.skipReason).toBe('missing_recipient')
    expect(whatsapp?.status).toBe('sent')
  })

  it('3. confirmed → confirmed creates no deliveries', async () => {
    const booking = makeBooking()
    const result = await handleBookingUpdated(db, {
      bookingId: booking.bookingId,
      before: makeBookingDoc(booking),
      after: makeBookingDoc(booking),
    })

    expect(result).toBeNull()
    expect(store.getAllDocs().size).toBe(0)
  })

  it('4. confirmed → completed creates no deliveries', async () => {
    const booking = makeBooking()
    const result = await handleBookingUpdated(db, {
      bookingId: booking.bookingId,
      before: makeBookingDoc(booking),
      after: makeBookingDoc({ ...booking, status: 'completed' }),
    })

    expect(result).toBeNull()
    expect(store.getAllDocs().size).toBe(0)
  })

  it('5. confirmed → cancelled creates no deliveries', async () => {
    const booking = makeBooking()
    const result = await handleBookingUpdated(db, {
      bookingId: booking.bookingId,
      before: makeBookingDoc(booking),
      after: makeBookingDoc({ ...booking, status: 'cancelled' }),
    })

    expect(result).toBeNull()
  })

  it('6. pending → cancelled creates no deliveries', async () => {
    const booking = makeBooking({ status: 'cancelled' })
    const result = await handleBookingUpdated(
      db,
      {
        bookingId: booking.bookingId,
        before: makeBookingDoc({ ...booking, status: 'pending' }),
        after: makeBookingDoc(booking),
      },
      mockSettingsReader,
    )

    expect(result).toBeNull()
  })

  it('7. duplicate trigger prevents duplicate sends', async () => {
    const booking = makeBooking()
    const emailService = successEmailService()
    const whatsappService = successWhatsappService()
    const ctx = {
      bookingId: booking.bookingId,
      before: makeBookingDoc({ ...booking, status: 'pending' }),
      after: makeBookingDoc(booking),
    }

    await handleBookingUpdated(
      db,
      ctx,
      mockSettingsReader,
      makeRuntime(emailService, whatsappService),
    )
    const second = await handleBookingUpdated(
      db,
      ctx,
      mockSettingsReader,
      makeRuntime(emailService, whatsappService),
    )

    expect(emailService.sendConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(whatsappService.sendConfirmationWhatsApp).toHaveBeenCalledTimes(1)
    expect(second!.channels.every((c) => !c.created)).toBe(true)
    expect(store.getAllDocs().size).toBe(2)
  })

  it('9. missing phone skips WhatsApp safely', async () => {
    const booking = makeBooking({ phoneNumber: '' })
    const result = await dispatchConfirmationNotifications(
      db,
      booking,
      mockSettingsReader,
      makeRuntime(successEmailService()),
    )

    const whatsapp = result.channels.find((c) => c.channel === 'whatsapp')
    expect(whatsapp?.status).toBe('skipped')
    expect(whatsapp?.skipReason).toBe('missing_recipient')
  })

  it('10. malformed booking fails safely without throwing', async () => {
    const result = await handleBookingUpdated(db, {
      bookingId: 'bad-booking',
      before: { status: 'pending' },
      after: { status: 'confirmed', customerName: 'X' },
    })

    expect(result!.error).toBeDefined()
    expect(result!.channels).toHaveLength(0)
    expect(store.getAllDocs().size).toBe(0)
  })
})

describe('createDeliveryIfAbsent concurrent execution', () => {
  it('8. only one delivery per idempotency key under concurrent calls', async () => {
    const store = new MockFirestore()
    const db = createMockDb(store)
    const bookingId = 'bk-concurrent'

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        createDeliveryIfAbsent(db, {
          bookingId,
          channel: 'email',
          recipient: 'test@example.com',
          status: 'pending',
          provider: 'brevo',
        }),
      ),
    )

    const createdCount = results.filter((r) => r.created).length
    expect(createdCount).toBe(1)
    expect(
      store.getDoc(`${NOTIFICATION_DELIVERIES_COLLECTION}/${bookingId}:confirmation:email`),
    ).toBeDefined()
  })
})

describe('dispatchEmailChannel', () => {
  let store: MockFirestore
  let db: FirebaseFirestore.Firestore

  beforeEach(() => {
    store = new MockFirestore()
    db = createMockDb(store)
    vi.clearAllMocks()
    mockSettingsReader.getNotificationSettings.mockResolvedValue({
      emailEnabled: true,
      whatsappEnabled: true,
    })
  })

  it('1. valid email → Brevo success → sent', async () => {
    const booking = makeBooking()
    const emailService = successEmailService('msg-abc')
    const result = await dispatchEmailChannel(
      db,
      booking,
      {
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        phoneNumber: booking.phoneNumber,
        email: booking.email,
        serviceName: booking.serviceName,
        serviceDuration: booking.serviceDuration,
        servicePrice: booking.servicePrice,
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
      },
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(emailService),
    )

    expect(result.status).toBe('sent')
    const doc = store.getDoc(
      `${NOTIFICATION_DELIVERIES_COLLECTION}/${booking.bookingId}:confirmation:email`,
    )
    expect(doc?.provider).toBe('brevo')
    expect(doc?.providerMessageId).toBe('msg-abc')
  })

  it('2. valid email → Brevo failure → failed', async () => {
    const booking = makeBooking()
    const result = await dispatchEmailChannel(
      db,
      booking,
      {
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        phoneNumber: booking.phoneNumber,
        email: booking.email,
        serviceName: booking.serviceName,
        serviceDuration: booking.serviceDuration,
        servicePrice: booking.servicePrice,
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
      },
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(
        failingEmailService(
          new EmailServiceError('Invalid email', 'permanent', 'provider_invalid_request', 400),
        ),
      ),
    )

    expect(result.status).toBe('failed')
    const doc = store.getDoc(
      `${NOTIFICATION_DELIVERIES_COLLECTION}/${booking.bookingId}:confirmation:email`,
    )
    expect(doc?.errorCode).toBe('provider_invalid_request')
  })

  it('3. missing email → skipped', async () => {
    const booking = makeBooking({ email: undefined })
    const result = await dispatchEmailChannel(
      db,
      booking,
      {
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        phoneNumber: booking.phoneNumber,
        serviceName: booking.serviceName,
        serviceDuration: booking.serviceDuration,
        servicePrice: booking.servicePrice,
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
      },
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(successEmailService()),
    )

    expect(result.status).toBe('skipped')
    expect(result.skipReason).toBe('missing_recipient')
  })

  it('4. empty-string email → skipped', async () => {
    const booking = makeBooking({ email: '' })
    const result = await dispatchEmailChannel(
      db,
      booking,
      {
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        phoneNumber: booking.phoneNumber,
        email: '',
        serviceName: booking.serviceName,
        serviceDuration: booking.serviceDuration,
        servicePrice: booking.servicePrice,
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
      },
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(successEmailService()),
    )

    expect(result.status).toBe('skipped')
    expect(result.skipReason).toBe('missing_recipient')
  })

  it('5. emailEnabled=false → skipped', async () => {
    const booking = makeBooking()
    const emailService = successEmailService()
    const result = await dispatchEmailChannel(
      db,
      booking,
      {
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        phoneNumber: booking.phoneNumber,
        email: booking.email,
        serviceName: booking.serviceName,
        serviceDuration: booking.serviceDuration,
        servicePrice: booking.servicePrice,
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
      },
      { emailEnabled: false, whatsappEnabled: true },
      makeRuntime(emailService),
    )

    expect(result.status).toBe('skipped')
    expect(result.skipReason).toBe('disabled')
    expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled()
  })

  it('7. existing sent delivery → no resend', async () => {
    const booking = makeBooking()
    const emailService = successEmailService()
    const payload = {
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      phoneNumber: booking.phoneNumber,
      email: booking.email,
      serviceName: booking.serviceName,
      serviceDuration: booking.serviceDuration,
      servicePrice: booking.servicePrice,
      preferredDate: booking.preferredDate,
      preferredTime: booking.preferredTime,
    }

    await dispatchEmailChannel(db, booking, payload, { emailEnabled: true }, makeRuntime(emailService))
    await dispatchEmailChannel(db, booking, payload, { emailEnabled: true }, makeRuntime(emailService))

    expect(emailService.sendConfirmationEmail).toHaveBeenCalledTimes(1)
  })

  it('15. booking confirmation unaffected when email fails', async () => {
    const booking = makeBooking()
    await expect(
      dispatchEmailChannel(
        db,
        booking,
        {
          bookingId: booking.bookingId,
          customerName: booking.customerName,
          phoneNumber: booking.phoneNumber,
          email: booking.email,
          serviceName: booking.serviceName,
          serviceDuration: booking.serviceDuration,
          servicePrice: booking.servicePrice,
          preferredDate: booking.preferredDate,
          preferredTime: booking.preferredTime,
        },
        { emailEnabled: true, whatsappEnabled: true },
        makeRuntime(
          failingEmailService(
            new EmailServiceError('Server error', 'transient', 'provider_server_error', 503),
          ),
        ),
      ),
    ).resolves.toMatchObject({ status: 'failed' })
  })
})

describe('createBrevoEmailService', () => {
  it('8. provider timeout is classified as transient and retried once', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Request timed out'))
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ messageId: 'retry-success' }),
      })

    const service = createBrevoEmailService({
      apiKey: 'test-key',
      fromEmail: 'bookings@makeng.test',
      fromName: 'Makeng Salon',
      fetchFn: fetchFn as unknown as typeof fetch,
    })

    const result = await service.sendConfirmationEmail({
      toEmail: 'customer@example.com',
      toName: 'Customer',
      subject: 'Test',
      htmlContent: '<p>Hi</p>',
      textContent: 'Hi',
    })

    expect(result.providerMessageId).toBe('retry-success')
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('9. provider 429 is retried then fails', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit',
    })

    const service = createBrevoEmailService({
      apiKey: 'test-key',
      fromEmail: 'bookings@makeng.test',
      fromName: 'Makeng Salon',
      fetchFn: fetchFn as unknown as typeof fetch,
    })

    await expect(
      service.sendConfirmationEmail({
        toEmail: 'customer@example.com',
        toName: 'Customer',
        subject: 'Test',
        htmlContent: '<p>Hi</p>',
        textContent: 'Hi',
      }),
    ).rejects.toMatchObject({ code: 'provider_rate_limited', kind: 'transient' })

    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('10. provider 5xx is transient', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Unavailable',
    })

    const service = createBrevoEmailService({
      apiKey: 'test-key',
      fromEmail: 'bookings@makeng.test',
      fromName: 'Makeng Salon',
      fetchFn: fetchFn as unknown as typeof fetch,
    })

    await expect(
      service.sendConfirmationEmail({
        toEmail: 'customer@example.com',
        toName: 'Customer',
        subject: 'Test',
        htmlContent: '<p>Hi</p>',
        textContent: 'Hi',
      }),
    ).rejects.toMatchObject({ kind: 'transient' })
  })

  it('11. provider 401 is permanent and not retried', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    })

    const service = createBrevoEmailService({
      apiKey: 'bad-key',
      fromEmail: 'bookings@makeng.test',
      fromName: 'Makeng Salon',
      fetchFn: fetchFn as unknown as typeof fetch,
    })

    await expect(
      service.sendConfirmationEmail({
        toEmail: 'customer@example.com',
        toName: 'Customer',
        subject: 'Test',
        htmlContent: '<p>Hi</p>',
        textContent: 'Hi',
      }),
    ).rejects.toMatchObject({ code: 'provider_unauthorized', kind: 'permanent' })

    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('12. invalid email request returns permanent failure', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Invalid email address',
    })

    const service = createBrevoEmailService({
      apiKey: 'test-key',
      fromEmail: 'bookings@makeng.test',
      fromName: 'Makeng Salon',
      fetchFn: fetchFn as unknown as typeof fetch,
    })

    await expect(
      service.sendConfirmationEmail({
        toEmail: 'not-an-email',
        toName: 'Customer',
        subject: 'Test',
        htmlContent: '<p>Hi</p>',
        textContent: 'Hi',
      }),
    ).rejects.toMatchObject({ kind: 'permanent' })
  })

  it('13. provider returns message ID', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ messageId: '<abc@brevo.com>' }),
    })

    const service = createBrevoEmailService({
      apiKey: 'test-key',
      fromEmail: 'bookings@makeng.test',
      fromName: 'Makeng Salon',
      fetchFn: fetchFn as unknown as typeof fetch,
    })

    const result = await service.sendConfirmationEmail({
      toEmail: 'customer@example.com',
      toName: 'Customer',
      subject: 'Test',
      htmlContent: '<p>Hi</p>',
      textContent: 'Hi',
    })

    expect(result.providerMessageId).toBe('<abc@brevo.com>')
  })

  it('14. error does not expose secrets', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'api-key: super-secret-key-value',
    })

    const service = createBrevoEmailService({
      apiKey: 'super-secret-key-value',
      fromEmail: 'bookings@makeng.test',
      fromName: 'Makeng Salon',
      fetchFn: fetchFn as unknown as typeof fetch,
    })

    try {
      await service.sendConfirmationEmail({
        toEmail: 'customer@example.com',
        toName: 'Customer',
        subject: 'Test',
        htmlContent: '<p>Hi</p>',
        textContent: 'Hi',
      })
    } catch (error) {
      expect(String(error)).not.toContain('super-secret-key-value')
    }
  })
})

describe('buildConfirmationEmail', () => {
  it('includes booking and salon details without internal ids', () => {
    const content = buildConfirmationEmail({
      bookingId: 'bk-123',
      customerName: 'Amara',
      phoneNumber: '+26652000001',
      email: 'amara@example.com',
      serviceName: 'Haircut',
      serviceDuration: 45,
      servicePrice: 150,
      preferredDate: '2026-08-12',
      preferredTime: '10:00',
      businessInfo: {
        salonName: 'Makeng Salon',
        phone: '+26652000002',
        email: 'hello@makeng.test',
        address: '123 Main St',
        timezone: 'Africa/Maseru',
      },
    })

    expect(content.subject).toContain('Makeng Salon')
    expect(content.html).toContain('Amara')
    expect(content.html).toContain('Haircut')
    expect(content.html).toContain('bk-123')
    expect(content.html).toContain('123 Main St')
    expect(content.html).not.toContain('notificationDeliveries')
  })
})

describe('dispatchWhatsappChannel', () => {
  let store: MockFirestore
  let db: FirebaseFirestore.Firestore

  beforeEach(() => {
    store = new MockFirestore()
    db = createMockDb(store)
    vi.clearAllMocks()
  })

  it('1. valid phone → Meta success → sent', async () => {
    const booking = makeBooking()
    const whatsappService = successWhatsappService('wamid.abc')
    const result = await dispatchWhatsappChannel(
      db,
      booking,
      makePayload(booking),
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(successEmailService(), whatsappService),
    )

    expect(result.status).toBe('sent')
    const doc = store.getDoc(
      `${NOTIFICATION_DELIVERIES_COLLECTION}/${booking.bookingId}:confirmation:whatsapp`,
    )
    expect(doc?.provider).toBe('meta-whatsapp')
    expect(doc?.providerMessageId).toBe('wamid.abc')
  })

  it('2. missing phone → skipped', async () => {
    const booking = makeBooking({ phoneNumber: '' })
    const result = await dispatchWhatsappChannel(
      db,
      booking,
      makePayload(booking),
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(successEmailService()),
    )

    expect(result.status).toBe('skipped')
    expect(result.skipReason).toBe('missing_recipient')
  })

  it('3. invalid phone → skipped with invalid_recipient', async () => {
    const booking = makeBooking({ phoneNumber: '+266123' })
    const result = await dispatchWhatsappChannel(
      db,
      booking,
      makePayload(booking),
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(successEmailService()),
    )

    expect(result.status).toBe('skipped')
    expect(result.skipReason).toBe('invalid_recipient')
  })

  it('4. whatsappEnabled=false → skipped', async () => {
    const booking = makeBooking()
    const whatsappService = successWhatsappService()
    const result = await dispatchWhatsappChannel(
      db,
      booking,
      makePayload(booking),
      { emailEnabled: true, whatsappEnabled: false },
      makeRuntime(successEmailService(), whatsappService),
    )

    expect(result.status).toBe('skipped')
    expect(result.skipReason).toBe('disabled')
    expect(whatsappService.sendConfirmationWhatsApp).not.toHaveBeenCalled()
  })

  it('5. Meta failure → failed', async () => {
    const booking = makeBooking()
    const result = await dispatchWhatsappChannel(
      db,
      booking,
      makePayload(booking),
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(
        successEmailService(),
        failingWhatsappService(
          new WhatsAppServiceError('Bad request', 'permanent', 'provider_invalid_request', 400),
        ),
      ),
    )

    expect(result.status).toBe('failed')
  })

  it('13. existing sent delivery → no resend', async () => {
    const booking = makeBooking()
    const whatsappService = successWhatsappService()
    const payload = makePayload(booking)

    await dispatchWhatsappChannel(
      db,
      booking,
      payload,
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(successEmailService(), whatsappService),
    )
    await dispatchWhatsappChannel(
      db,
      booking,
      payload,
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(successEmailService(), whatsappService),
    )

    expect(whatsappService.sendConfirmationWhatsApp).toHaveBeenCalledTimes(1)
  })

  it('14. existing failed delivery is not resent on duplicate trigger', async () => {
    const booking = makeBooking()
    const payload = makePayload(booking)
    const failing = failingWhatsappService(
      new WhatsAppServiceError('Server error', 'transient', 'provider_server_error', 503),
    )

    await dispatchWhatsappChannel(
      db,
      booking,
      payload,
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(successEmailService(), failing),
    )
    await dispatchWhatsappChannel(
      db,
      booking,
      payload,
      { emailEnabled: true, whatsappEnabled: true },
      makeRuntime(successEmailService(), successWhatsappService()),
    )

    expect(failing.sendConfirmationWhatsApp).toHaveBeenCalledTimes(1)
  })

  it('18. template configuration missing → failed', async () => {
    const booking = makeBooking()
    const runtime = makeRuntime(successEmailService())
    runtime.whatsappConfig = { ...defaultWhatsappConfig, templateName: '' }

    const result = await dispatchWhatsappChannel(
      db,
      booking,
      makePayload(booking),
      { emailEnabled: true, whatsappEnabled: true },
      runtime,
    )

    expect(result.status).toBe('failed')
    expect(
      store.getDoc(
        `${NOTIFICATION_DELIVERIES_COLLECTION}/${booking.bookingId}:confirmation:whatsapp`,
      )?.errorCode,
    ).toBe('provider_not_configured')
  })

  it('20. phone number ID missing → failed', async () => {
    const booking = makeBooking()
    const runtime = makeRuntime(successEmailService())
    runtime.whatsappConfig = { ...defaultWhatsappConfig, phoneNumberId: '' }

    const result = await dispatchWhatsappChannel(
      db,
      booking,
      makePayload(booking),
      { emailEnabled: true, whatsappEnabled: true },
      runtime,
    )

    expect(result.status).toBe('failed')
  })
})

describe('failure isolation', () => {
  let store: MockFirestore
  let db: FirebaseFirestore.Firestore

  beforeEach(() => {
    store = new MockFirestore()
    db = createMockDb(store)
  })

  it('15. email succeeds while WhatsApp fails', async () => {
    const booking = makeBooking()
    const result = await dispatchConfirmationNotifications(
      db,
      booking,
      mockSettingsReader,
      makeRuntime(
        successEmailService(),
        failingWhatsappService(
          new WhatsAppServiceError('Unavailable', 'transient', 'provider_server_error', 503),
        ),
      ),
    )

    expect(result.channels.find((c) => c.channel === 'email')?.status).toBe('sent')
    expect(result.channels.find((c) => c.channel === 'whatsapp')?.status).toBe('failed')
  })

  it('16. email fails while WhatsApp succeeds', async () => {
    const booking = makeBooking()
    const result = await dispatchConfirmationNotifications(
      db,
      booking,
      mockSettingsReader,
      makeRuntime(
        failingEmailService(
          new EmailServiceError('Unavailable', 'transient', 'provider_server_error', 503),
        ),
        successWhatsappService(),
      ),
    )

    expect(result.channels.find((c) => c.channel === 'email')?.status).toBe('failed')
    expect(result.channels.find((c) => c.channel === 'whatsapp')?.status).toBe('sent')
  })

  it('17. both channels succeed', async () => {
    const booking = makeBooking()
    const result = await dispatchConfirmationNotifications(
      db,
      booking,
      mockSettingsReader,
      makeRuntime(successEmailService(), successWhatsappService()),
    )

    expect(result.channels.find((c) => c.channel === 'email')?.status).toBe('sent')
    expect(result.channels.find((c) => c.channel === 'whatsapp')?.status).toBe('sent')
  })

  it('23. booking remains confirmed after WhatsApp failure', async () => {
    const booking = makeBooking({ status: 'confirmed' })
    await expect(
      dispatchWhatsappChannel(
        db,
        booking,
        makePayload(booking),
        { emailEnabled: true, whatsappEnabled: true },
        makeRuntime(
          successEmailService(),
          failingWhatsappService(
            new WhatsAppServiceError('Unauthorized', 'permanent', 'provider_unauthorized', 401),
          ),
        ),
      ),
    ).resolves.toMatchObject({ status: 'failed' })
    expect(booking.status).toBe('confirmed')
  })
})

describe('createMetaWhatsAppService', () => {
  const baseConfig = {
    accessToken: 'test-access-token',
    whatsappConfig: defaultWhatsappConfig,
  }

  it('6. Meta 400 → failed permanent', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Invalid parameter',
    })

    const service = createMetaWhatsAppService({
      ...baseConfig,
      fetchFn: fetchFn as unknown as typeof fetch,
    })

    await expect(
      service.sendConfirmationWhatsApp({
        payload: makePayload(makeBooking()),
        recipientE164: '+26652000001',
      }),
    ).rejects.toMatchObject({ kind: 'permanent' })
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('7. Meta 401 → failed permanent', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Invalid OAuth access token',
    })

    const service = createMetaWhatsAppService({ ...baseConfig, fetchFn: fetchFn as unknown as typeof fetch })

    await expect(
      service.sendConfirmationWhatsApp({
        payload: makePayload(makeBooking()),
        recipientE164: '+26652000001',
      }),
    ).rejects.toMatchObject({ code: 'provider_unauthorized', kind: 'permanent' })
  })

  it('8. Meta 429 → retried', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit',
    })

    const service = createMetaWhatsAppService({ ...baseConfig, fetchFn: fetchFn as unknown as typeof fetch })

    await expect(
      service.sendConfirmationWhatsApp({
        payload: makePayload(makeBooking()),
        recipientE164: '+26652000001',
      }),
    ).rejects.toMatchObject({ code: 'provider_rate_limited' })

    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('9. Meta 500 → transient', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal error',
    })

    const service = createMetaWhatsAppService({ ...baseConfig, fetchFn: fetchFn as unknown as typeof fetch })

    await expect(
      service.sendConfirmationWhatsApp({
        payload: makePayload(makeBooking()),
        recipientE164: '+26652000001',
      }),
    ).rejects.toMatchObject({ kind: 'transient' })
  })

  it('10. network timeout → retried then fails', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Request timed out'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ messages: [{ id: 'wamid.retry' }] }),
      })

    const service = createMetaWhatsAppService({ ...baseConfig, fetchFn: fetchFn as unknown as typeof fetch })

    const result = await service.sendConfirmationWhatsApp({
      payload: makePayload(makeBooking()),
      recipientE164: '+26652000001',
    })

    expect(result.providerMessageId).toBe('wamid.retry')
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('11. provider message ID stored', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ messages: [{ id: 'wamid.HBgLMjY2NTIwMDAwMDE' }] }),
    })

    const service = createMetaWhatsAppService({ ...baseConfig, fetchFn: fetchFn as unknown as typeof fetch })

    const result = await service.sendConfirmationWhatsApp({
      payload: makePayload(makeBooking()),
      recipientE164: '+26652000001',
    })

    expect(result.providerMessageId).toBe('wamid.HBgLMjY2NTIwMDAwMDE')
  })

  it('19. access token missing throws at service creation', () => {
    expect(() =>
      createMetaWhatsAppService({
        accessToken: '',
        whatsappConfig: defaultWhatsappConfig,
      }),
    ).toThrow(/access token/i)
  })

  it('21. template API rejection classified as invalid_template', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Template name does not exist in the translation',
    })

    const service = createMetaWhatsAppService({ ...baseConfig, fetchFn: fetchFn as unknown as typeof fetch })

    await expect(
      service.sendConfirmationWhatsApp({
        payload: makePayload(makeBooking()),
        recipientE164: '+26652000001',
      }),
    ).rejects.toMatchObject({ code: 'invalid_template' })
  })

  it('22. error logs do not contain token', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Bearer invalid-token-xyz',
    })

    const service = createMetaWhatsAppService({
      accessToken: 'invalid-token-xyz',
      whatsappConfig: defaultWhatsappConfig,
      fetchFn: fetchFn as unknown as typeof fetch,
    })

    try {
      await service.sendConfirmationWhatsApp({
        payload: makePayload(makeBooking()),
        recipientE164: '+26652000001',
      })
    } catch (error) {
      expect(String(error)).not.toContain('invalid-token-xyz')
    }
  })
})

describe('buildConfirmationWhatsAppTemplate', () => {
  it('formats E.164 phone for Meta and includes booking fields', () => {
    const message = buildConfirmationWhatsAppTemplate(
      {
        bookingId: 'bk-123',
        customerName: 'Amara',
        phoneNumber: '+26652000001',
        serviceName: 'Haircut',
        serviceDuration: 45,
        servicePrice: 150,
        preferredDate: '2026-08-12',
        preferredTime: '10:00',
        businessInfo: {
          salonName: 'Makeng Salon',
          phone: '+26652000002',
          email: 'hello@makeng.test',
          address: '123 Main St',
          timezone: 'Africa/Maseru',
        },
      },
      '+26652000001',
      { templateName: 'appointment_confirmation', templateLanguage: 'en' },
    )

    expect(message.to).toBe('26652000001')
    expect(message.template.name).toBe('appointment_confirmation')
    expect(message.template.components[0].parameters).toHaveLength(7)
    expect(message.template.components[0].parameters[0].text).toBe('Amara')
  })
})
