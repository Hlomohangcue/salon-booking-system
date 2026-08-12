# Notification Pipeline — Makeng Salon

Server-side notification infrastructure for appointment confirmations.

- **Email:** Brevo (Phase 4.3)
- **WhatsApp:** Meta WhatsApp Cloud API (Phase 4.4)

---

## Architecture

```
Admin confirms appointment
        ↓
Firestore: pending → confirmed
        ↓
Cloud Function: onBookingUpdated
        ↓
notificationOrchestrator
        ├── email → Brevo API
        └── whatsapp → Meta Graph API
        ↓
notificationDeliveries audit records
```

The admin confirmation flow is unchanged — notifications run **after** the Firestore write.

---

## Brevo email (Phase 4.3)

See [Email configuration](#email-secrets--configuration) below.

API: `POST https://api.brevo.com/v3/smtp/email`

---

## Meta WhatsApp Cloud API (Phase 4.4)

WhatsApp messages are sent via the **Meta Graph API**:

```
POST https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
```

Default API version: **`v21.0`** (configurable via `WHATSAPP_API_VERSION`).

Implementation files:

- `functions/src/services/whatsappService.ts`
- `functions/src/templates/confirmationWhatsApp.ts`
- `functions/src/config/whatsappConfig.ts`

### Delivery semantics

**`sent` means Meta accepted the message request.** It does NOT guarantee the customer has received or read the message. Final delivery/read status requires Meta webhooks (future phase).

---

## Email secrets & configuration

### Secrets

| Name | Type |
|---|---|
| `BREVO_API_KEY` | Secret |
| `WHATSAPP_ACCESS_TOKEN` | Secret |

```bash
firebase functions:secrets:set BREVO_API_KEY
firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN
```

### Non-secret parameters

| Name | Description |
|---|---|
| `NOTIFICATION_FROM_EMAIL` | Brevo verified sender |
| `NOTIFICATION_FROM_NAME` | Sender display name (default: Makeng Salon) |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta phone number ID |
| `WHATSAPP_CONFIRMATION_TEMPLATE` | Approved template name |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Template locale (default: `en`) |
| `WHATSAPP_API_VERSION` | Graph API version (default: `v21.0`) |

Template name and language are **configuration, not secrets** — they are not sensitive but must match an approved Meta template exactly.

```bash
firebase functions:params:set WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
firebase functions:params:set WHATSAPP_CONFIRMATION_TEMPLATE="your_template_name"
firebase functions:params:set WHATSAPP_TEMPLATE_LANGUAGE="en"
```

---

## WhatsApp template requirements

Submit this template to Meta for approval before production use. Parameter count and order must match exactly.

**Suggested template name:** configure via `WHATSAPP_CONFIRMATION_TEMPLATE` (e.g. `appointment_confirmation`)

**Category:** Utility / Transactional

**Body example:**

```
Appointment Confirmed

Hello {{1}}, your appointment at {{2}} is confirmed.
Service: {{3}}
Date: {{4}}
Time: {{5}}
Reference: {{6}}
{{7}}
```

| Parameter | Source |
|---|---|
| {{1}} | Customer name |
| {{2}} | Salon name (`settings/businessInfo`) |
| {{3}} | Service name |
| {{4}} | Formatted appointment date |
| {{5}} | Formatted appointment time |
| {{6}} | Booking reference ID |
| {{7}} | Salon phone/address or "—" |

---

## Phone number format

Bookings store phone numbers in **E.164** format (e.g. `+26652000001`).

Meta API expects digits **without** the leading `+`. The service converts automatically:

```
+26652000001 → 26652000001
```

Validation uses the existing Lesotho regex: `^\+266[2-8]\d{7}$`

| Condition | Result |
|---|---|
| Phone empty | `skipped` / `missing_recipient` |
| Phone present but invalid | `skipped` / `invalid_recipient` |
| Valid E.164 | Attempt Meta send |

---

## Notification settings

Reads `settings/notifications` via Admin SDK:

| Field | Default if missing | Behavior |
|---|---|---|
| `emailEnabled` | `false` | Skip email when false |
| `whatsappEnabled` | `false` | Skip WhatsApp when false |

Enable for staging:

```json
{
  "emailEnabled": true,
  "whatsappEnabled": true
}
```

---

## Delivery lifecycle (both channels)

```
pending → processing → provider API → sent | failed
                              ↓
                           skipped (missing/disabled/invalid)
```

| Provider | Channel |
|---|---|
| `brevo` | email |
| `meta-whatsapp` | whatsapp |

---

## Idempotency

Keys (also Firestore document IDs):

```
{bookingId}:confirmation:email
{bookingId}:confirmation:whatsapp
```

Terminal states (`sent`, `skipped`, `failed`) prevent duplicate sends on repeated trigger delivery.

### Known at-least-once risk

The current architecture uses:

1. Claim delivery (`pending`)
2. Mark `processing`
3. Call provider API
4. Mark `sent` or `failed`

If the function **crashes after a successful API call but before step 4**, the delivery may remain in `processing`. A Cloud Function retry could send the message again. **True exactly-once delivery is not guaranteed** without additional mechanisms (e.g. provider idempotency keys, outbox pattern, or webhook reconciliation).

This same risk applies to both email and WhatsApp channels.

---

## Failure isolation

Email and WhatsApp are independent. One channel failing does not affect the other or the booking status.

| Scenario | Email | WhatsApp | Booking |
|---|---|---|---|
| Email OK, WhatsApp fails | sent | failed | confirmed |
| Email fails, WhatsApp OK | failed | sent | confirmed |
| Both fail | failed | failed | confirmed |

Notification failures **never** change `booking.status`.

---

## Error handling

### Permanent (no retry)

- HTTP 400, 401, 403, 404
- Invalid template / invalid recipient
- Missing configuration

### Transient (one inline retry)

- HTTP 429, 5xx
- Network timeout

After retry exhaustion, status is recorded as `failed`.

---

## Security

```javascript
match /notificationDeliveries/{deliveryId} {
  allow read: if isAdmin();
  allow create, update, delete: if false;
}
```

Never store `WHATSAPP_ACCESS_TOKEN`, `BREVO_API_KEY`, or other secrets in Firestore or frontend env vars.

---

## Testing

```bash
npm run test:functions
```

All provider APIs are mocked in unit tests — no real credentials required.

---

## External Meta configuration required

Before production WhatsApp delivery, complete in Meta Business Manager:

1. **Meta Business account**
2. **WhatsApp Business Account (WABA)**
3. **Phone number** registered to Cloud API
4. **Permanent access token** with `whatsapp_business_messaging` permission
5. **Phone number ID** (from Meta developer console)
6. **Approved message template** matching the parameter structure above
7. **Template language** matching `WHATSAPP_TEMPLATE_LANGUAGE`
8. **Test recipient numbers** added during development (if app is in test mode)

None of the above are configured by this codebase — they must be set up manually in Meta.

---

## Deployment

- Requires Firebase **Blaze** plan (external API calls)
- Deploy: `npm run deploy` (after setting secrets/parameters)
- Nothing is deployed automatically by the codebase

---

## Phase 4.5 (future)

- Admin notification status UI
- Manual resend callable
- Meta delivery/read webhooks
- Dedicated retry queue for failed deliveries
