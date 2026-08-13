# Makeng Salon Booking System

A modern online booking platform for Makeng Salon built with React, TypeScript, Vite, Tailwind CSS v4, and Firebase.

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Database | Firebase Firestore |
| Forms | React Hook Form + Zod |
| Linting | Oxlint |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- A Firebase project (Firestore enabled)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase credentials**

   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env     # Windows
   cp .env.example .env       # macOS / Linux
   ```

   Open `.env` and replace every placeholder with your real Firebase values.
   Find them in the [Firebase console](https://console.firebase.google.com) → Project Settings → Your apps.

   ```env
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123:web:abc
   ```

   **Gallery image hosting (Cloudinary — client-owned account):**

   ```env
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
   ```

   - The Cloudinary cloud name and unsigned upload preset are **public frontend configuration** (safe in `VITE_*` variables).
   - **`CLOUDINARY_API_SECRET` must never be placed in frontend code or `VITE_*` variables.**
   - **Firebase Storage is not required** for the Gallery feature and must not be deployed for gallery uploads.
   - See `docs/GALLERY.md` for Cloudinary preset setup.

3. **Seed Firestore with development data**

   ```bash
   npm run seed
   ```

   This writes the following to Firestore (idempotent — safe to re-run):

   | Collection | Documents | Notes |
   |---|---|---|
   | `services` | 7 salon services | Haircut, Styling, Coloring, Braiding, Treatment, Beard, Makeup |
   | `settings` | `bookingConfig` | Opening hours, slot interval, booking window, holidays |
   | `holidays` | 11 Lesotho public holidays (2026) | Development examples — verify dates annually |

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Firestore Setup

Before seeding, ensure Firestore is in **test mode** or your security rules allow writes.
In the Firebase console: Firestore Database → Rules → set to test mode for development.

> **Security rules for production** are documented in `docs/FIRESTORE_SECURITY.md`.

## Resetting Development Data

Re-running `npm run seed` overwrites all seeded documents with fresh defaults (document IDs are stable). To fully reset:
1. In the Firebase console, delete the `services`, `settings`, and `holidays` collections.
2. Run `npm run seed` again.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run Oxlint |
| `npm run seed` | Seed Firestore with development data |
| `npm run deploy` | Deploy hosting + Firestore rules + indexes (requires Firebase CLI) |

## Performance

The app uses **route-level code splitting** (`React.lazy` + `Suspense`), so each page is fetched
on demand. The initial shell bundles only the shared UI and routing (≈ 293 kB / 93 kB gzip), while
heavier pages such as the booking wizard (which loads the Firebase SDK) are deferred until visited.

## Deployment

The project is configured for **Firebase Hosting + Cloud Firestore**:

- `firebase.json` — hosting config (SPA rewrite, caching, security headers) + Firestore rules/indexes
- `.firebaserc` — default project (`saloon-booking-ace4f`)
- `firestore.rules` — production Firestore security rules (least-privilege)
- `firestore.indexes.json` — required composite indexes for the booking queries

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full deployment guide, including DNS/SSL setup,
pre-deployment checks, and rollout steps.

## Environment Variables

All required variables are documented in `.env.example`. Copy it to `.env` and provide your Firebase project values. The `.env` file is git-ignored and must never be committed.

## Project Structure

```
index.html
vite.config.ts            # Vite config (React + Tailwind v4 plugins)
firebase.json             # Firebase Hosting + Firestore rules/indexes config
.firebaserc               # Default Firebase project
firestore.rules           # Production Firestore security rules
firestore.indexes.json    # Composite indexes for booking queries
DEPLOYMENT.md             # Deployment guide (hosting, DNS/SSL, rollout)
src/
├── router.tsx            # Routes with lazy-loaded (code-split) pages
├── components/
│   ├── layout/           # Navbar, Footer, Layout wrapper
│   └── ui/               # Button, Card, Container, SectionTitle, PageFallback
├── features/
│   └── booking/          # Booking feature module
│       ├── components/   # BookingWizard + step components
│       ├── hooks/        # useBooking, useServices, useAvailability, useSubmitBooking
│       ├── services/     # Firestore read/write functions
│       ├── utils/        # Validation, date helpers, slot generator
│       ├── errors/       # Typed booking errors
│       └── types.ts      # Booking-specific TypeScript types
├── pages/               # Route-level page components
├── lib/                 # Firebase initialisation
└── types/               # Shared TypeScript type definitions
scripts/
└── seedFirestore.ts     # Firestore development data seeder
docs/
└── FIRESTORE_SECURITY.md  # Firestore security rules design
```
