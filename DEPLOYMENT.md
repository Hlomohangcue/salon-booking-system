# Deployment Guide

Deployment target: **Firebase Hosting + Cloud Firestore**
Project ID: **`saloon-booking-ace4f`**
Target domain: **`booking.slimeshustlers.com`**

This guide covers the recommended setup, DNS/SSL configuration, pre-deployment checks, and rollout steps. It does **not** execute a deploy — those steps are for a human operator with the appropriate credentials.

---

## 1. Prerequisites

- **Node.js 18+** and **npm 9+**
- **Firebase CLI** (v13+):
  ```bash
  npm install -g firebase-tools
  ```
- Access to the Firebase project `saloon-booking-ace4f` (Owner/Editor role).
- Control of the DNS zone for `slimeshustlers.com` (to add a subdomain record).

---

## 2. One-Time Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure `.env`**
   Copy `.env.example` to `.env` and fill in the real Firebase values from the Firebase Console → Project Settings → Your apps.
   ```bash
   copy .env.example .env   # Windows
   cp .env.example .env     # macOS / Linux
   ```
   > `.env` is git-ignored and must never be committed. `.env.example` (safe, no secrets) **is** tracked.

3. **Log in to Firebase**
   ```bash
   firebase login
   ```

4. **Verify the project target**
   The default project is already set in `.firebaserc` to `saloon-booking-ace4f`.
   ```bash
   firebase use saloon-booking-ace4f
   ```

5. **Seed Firestore** (development data — services, booking config, holidays)
   ```bash
   npm run seed
   ```
   > Firestore must permit writes (test mode or the rules below deployed). In production the rules in `firestore.rules` deny direct client writes to `services`/`settings`/`holidays`, so seed **before** deploying the locked-down rules, or seed via a temporary rules override / the Admin SDK.

---

## 3. Build & Local Verification

```bash
npm run build     # type-check + production build → dist/
npm run lint      # oxlint — expects 0 warnings / 0 errors
npm run preview   # serve the production build locally for a smoke test
```

The production build uses **route-level code splitting**. The initial shell is ~293 kB (93 kB gzip); the booking page (which includes the Firebase SDK) loads on demand.

---

## 4. Deploy

```bash
npm run deploy
```

This is equivalent to:

```bash
firebase deploy --only hosting,firestore
```

It deploys:

| Target | Source | Purpose |
|---|---|---|
| **Hosting** | `dist/` | SPA (see `firebase.json`) with SPA rewrite, caching, and security headers |
| **Firestore Rules** | `firestore.rules` | Least-privilege production security rules |
| **Firestore Indexes** | `firestore.indexes.json` | Composite indexes required by the booking queries |

> If you only changed code, you can deploy just hosting to avoid re-publishing rules:
> ```bash
> firebase deploy --only hosting
> ```

---

## 5. Custom Domain & SSL (booking.slimeshustlers.com)

Firebase Hosting provides automatic, free SSL certificates once the domain is connected.

1. **Add the custom domain** in the Firebase Console → Hosting → Add custom domain → `booking.slimeshustlers.com`.
2. **Add a DNS record** at your DNS provider (`slimeshustlers.com`). Firebase provides a target (e.g. `booking.slimeshustlers.com.web.app` and a `_acme-challenge` TXT record for verification). The recommended record is usually a CNAME:

   | Type   | Name (host)              | Value                             |
   |--------|--------------------------|-----------------------------------|
   | CNAME  | `booking`                | `<your-project>.web.app`          |

   Firebase may also require a `_acme-challenge.booking` TXT record for SSL issuance.
3. **Await SSL provisioning** — Firebase issues the certificate automatically (usually within minutes to a few hours). Verify the SSL badge shows "Connected".
4. **Enable the redirect** from the default `saloon-booking-ace4f.web.app` to your custom domain if desired (Hosting → Domain → Redirect).

---

## 6. Pre-Deployment Checklist

- [ ] `.env` contains real Firebase credentials (not placeholders).
- [ ] `.env` is **not** committed; `.env.example` provides documented placeholders.
- [ ] `npm run build` completes with **no TypeScript errors**.
- [ ] `npm run lint` reports **0 warnings and 0 errors**.
- [ ] Firestore data is seeded (`services`, `settings/bookingConfig`, `holidays`).
- [ ] Composite indexes in `firestore.indexes.json` are created in the Firebase console (or auto-created on deploy).
- [ ] `firestore.rules` are reviewed — guests can only `create` bookings with `status='pending'` and server timestamps; `update`/`delete` are denied.
- [ ] SPA rewrite (`** → /index.html`) confirmed in `firebase.json` so deep links and refreshes work.
- [ ] Cascade cache headers applied to `/assets/**` (immutable, 1 year) and security headers on `**`.
- [ ] Test the booking flow end-to-end on the preview build before deploying.

---

## 7. Post-Deployment Verification

- Visit `https://booking.slimeshustlers.com` (and the fallback `*.web.app` URL).
- Test a full booking: Service → Date → Time → Details → Review → Confirm → Success screen with a booking reference.
- Refresh a deep link (e.g. `/book`) to confirm the SPA rewrite works.
- Confirm the booking document appears in Firestore with `status: "pending"` and server timestamps.
- Confirm the success screen shows the Firestore document ID as the booking reference.
- Test the security rules by attempting (and expecting denial of) a client-side `update`/`delete` on a booking.

---

## 8. Rollback

Firebase Hosting hosts multiple releases and supports instant rollback:

- **Console**: Hosting → Releases → select the previous release → "Rollback".
- **CLI**: `firebase hosting:clone <project> <source-release-id> <target-channel>` or redeploy a previous build.

Firestore rules and indexes can be redeployed with `firebase deploy --only firestore` from the desired rules version.

---

## 9. Production Readiness Notes & Known Limitations

| Area | Status | Notes |
|---|---|---|
| Guest booking creation | ✅ | Transactional, double-booking-safe |
| Booking security rules | ✅ | Guests create only; status forced to `pending`; server timestamps |
| Client-side availability check | ✅ | Reads active bookings for a date |
| **Server-side availability check** | ⚠️ | Availability is verified in a client `runTransaction`; a Cloud Function would be more robust (see `docs/FIRESTORE_SECURITY.md`) |
| Booking status management | ⚠️ | No admin UI yet — status changes require a future admin phase (update rule is currently `false`) |
| Customer booking lookup/cancel | ⚠️ | Not yet implemented |
| Analytics / monitoring | ⚠️ | Not configured |
| Rate limiting (3 pending/phone) | ⚠️ | Documented strategy, not yet enforced |

These are **not blockers** for the current customer booking flow, but should be tracked before/after launch depending on expected traffic.
