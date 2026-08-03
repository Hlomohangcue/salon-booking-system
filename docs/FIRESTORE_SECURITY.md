# Firestore Security Design
## Makeng Salon Booking System

---

## 1. Collections

### `bookings`
Stores every appointment request. Each document is the single source of truth for one booking.

```
bookings/{auto-id}
├── bookingId         string     // same as document ID — denormalised for client queries
├── customerName      string
├── phoneNumber       string     // E.164 +266XXXXXXXX (Lesotho)
├── email             string?
├── serviceId         string     // references services/{serviceId}
├── serviceName       string     // snapshot at booking time
├── serviceDuration   number     // minutes — snapshot at booking time
├── preferredDate     string     // "YYYY-MM-DD" — NOT a Timestamp (avoids timezone drift)
├── preferredTime     string     // "HH:MM" 24-hour
├── status            string     // pending | confirmed | cancelled | completed | no-show
├── createdAt         Timestamp  // set via serverTimestamp()
├── updatedAt         Timestamp  // updated on every write
├── notes             string?
├── staffId           string?    // future: staff assignment
├── branchId          string?    // future: multi-branch
├── confirmedAt       Timestamp? // set when salon confirms
├── cancelledAt       Timestamp? // set when cancelled
├── cancellationReason string?
└── source            string     // web | admin | whatsapp
```

### `services`
Catalogue of available salon services. Managed by the salon owner via admin dashboard (future).

```
services/{auto-id}
├── serviceId         string     // same as document ID
├── name              string
├── description       string
├── durationMinutes   number     // drives the time slot blocking calculation
├── priceFrom         number     // minimum price in local currency
├── isActive          boolean    // false = hidden from booking form
├── category          string     // hair | beard | makeup | treatment
├── sortOrder         number     // controls display order
└── createdAt         Timestamp
```

### `settings`
Singleton configuration documents. Managed by the salon owner.

```
settings/bookingConfig
├── openingHours      map        // { mon: { open: "08:00", close: "19:00" }, ... }
├── slotIntervalMins  number     // 30 — time slot grid granularity
├── bookingWindowDays number     // 30 — how far ahead customers can book
├── minAdvanceHours   number     // 2 — minimum hours before a bookable slot
├── maxBookingsPerSlot number    // 1 — concurrent bookings per slot
└── holidays          string[]   // ["YYYY-MM-DD", ...] — closed days
```

---

## 2. Recommended Security Rules

> **Note:** These are design-intent rules. Actual Firestore rules will be written in a
> dedicated `firestore.rules` file during Phase 4 (admin + auth).

### `bookings`
```
// Phase 3 (no auth): customers book as guests
allow create: if
  // Only "pending" status allowed on creation — never "confirmed" from the client
  request.resource.data.status == "pending"
  // Timestamps must be server-set
  && request.resource.data.createdAt == request.time
  && request.resource.data.updatedAt == request.time
  // Required fields must be present
  && request.resource.data.keys().hasAll([
       'customerName','phoneNumber','serviceId','serviceName',
       'serviceDuration','preferredDate','preferredTime',
       'status','createdAt','updatedAt','source'
     ])
  // Customer name length
  && request.resource.data.customerName.size() >= 2
  && request.resource.data.customerName.size() <= 80
  // Lesotho E.164 phone
  && request.resource.data.phoneNumber.matches('^\\+266[2-8][0-9]{7}$')
  // source must be web for customer submissions
  && request.resource.data.source == "web"

// Public read by bookingId — customer uses their reference number to check status
allow read: if true

// Only authenticated admins may update status (Phase 4+)
allow update: if request.auth != null
  && request.auth.token.role == "admin"
  // updatedAt must always be refreshed
  && request.resource.data.updatedAt == request.time

// No client-side deletes — cancelled bookings are kept for audit history
allow delete: if false
```

### `services`
```
allow read: if true          // public — required for the booking wizard
allow write: if request.auth != null && request.auth.token.role == "admin"
```

### `settings`
```
allow read: if true          // public — required for slot generation
allow write: if request.auth != null && request.auth.token.role == "admin"
```

---

## 3. Transaction Strategy

All booking writes MUST use `runTransaction()` to prevent double-bookings.

### Why transactions are required
Without a transaction, two customers submitting at the same millisecond could both
pass the availability check, both receive "slot available", and both write a booking —
resulting in a double-booked appointment.

### Transaction flow (createBooking)
```
runTransaction(db, async (tx) => {
  // 1. Read the current bookings for the requested date inside the transaction
  const existingSnap = await tx.get(
    query(bookingsRef, where('preferredDate','==',date), where('status','in',['pending','confirmed']))
  )

  // 2. Extract booked slots from the transactional snapshot
  const bookedTimes = existingSnap.docs.map(d => d.data().preferredTime)

  // 3. Regenerate available slots with the transactional data
  const available = generateAvailableSlots({ date, config, serviceDurationMins, bookedSlots: bookedTimes })

  // 4. If the requested slot is gone, abort
  if (!available.includes(requestedTime)) {
    throw new Error('SLOT_UNAVAILABLE')
  }

  // 5. Write the new booking atomically
  const newRef = doc(collection(db, 'bookings'))
  tx.set(newRef, {
    ...bookingData,
    bookingId: newRef.id,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return newRef.id
})
```

### Client error handling
- `SLOT_UNAVAILABLE` → show "This slot was just taken — please choose another time"
- Network errors → retry up to 2 times before showing a generic error

---

## 4. Composite Index Requirements

Firestore requires composite indexes for queries that combine multiple `where` clauses
with an `orderBy`. Create the following indexes in the Firebase console.

| Collection | Fields | Order | Usage |
|---|---|---|---|
| `bookings` | `preferredDate` ASC, `status` ASC | ASC / ASC | Availability check |
| `bookings` | `preferredDate` ASC, `preferredTime` ASC | ASC / ASC | Admin day view |
| `bookings` | `preferredDate` ASC, `status` ASC, `preferredTime` ASC | ASC / ASC / ASC | Admin filtered day view |
| `bookings` | `phoneNumber` ASC, `status` ASC | ASC / ASC | Duplicate check |
| `bookings` | `createdAt` DESC | DESC | Admin recent bookings feed |
| `services` | `isActive` ASC, `sortOrder` ASC | ASC / ASC | Customer service list |

---

## 5. Duplicate Booking Prevention

Defence-in-depth: validated at every layer.

### Layer 1 — UI (bookingValidation.ts + react-hook-form)
- Phone normalisation prevents format variations from bypassing checks
- Date/time validation ensures only valid, future slots can be submitted

### Layer 2 — bookingService.ts (pre-write check)
Before opening the transaction, query:
```
where('phoneNumber', '==', normalizedPhone)
where('preferredDate', '==', date)
where('status', 'in', ['pending', 'confirmed'])
```
If a document is found → return `DUPLICATE_BOOKING` error without writing.

### Layer 3 — Firestore Transaction (atomic slot check)
The transaction re-reads all booked slots at write time. Even if two requests
pass Layer 2 simultaneously, only one transaction can complete for a given slot.

### Layer 4 — Firestore Security Rules
The `status == "pending"` restriction on `create` means clients can never write
"confirmed" directly, and field validation in rules acts as a final server-side guard.

### Rate limiting (recommended — Phase 4)
Reject if `phoneNumber` has more than 3 `pending` or `confirmed` bookings across
any future date. Enforced in the service layer and mirrored in security rules.

---

## 6. Future Admin Authentication

When Firebase Auth is added (Phase 4+):

- Customers authenticate via **phone OTP** (Firebase Phone Auth)
  - Booking documents gain a `userId` field alongside `phoneNumber`
  - Customers can view and cancel their own bookings when logged in

- Admins receive a **custom claim**: `{ role: "admin" }`
  - Set via Firebase Admin SDK in a Cloud Function or manually in the console
  - Security rules check `request.auth.token.role == "admin"` for all write access

- Security rules tighten once auth is live:
  - Booking `read` changes from `true` to `request.auth != null && (resource.data.userId == request.auth.uid || request.auth.token.role == "admin")`
  - Guest (unauthenticated) booking remains supported via a limited `create` rule

---

## 7. Data Retention

- **Never delete** booking documents. Cancelled and completed bookings are historical records.
- Implement a Cloud Function to **archive** documents older than 2 years to Firestore export
  or BigQuery for analytics (future phase).
- `status: 'no-show'` documents must be retained for pattern detection and potential
  future automated penalties.
