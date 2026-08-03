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
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123:web:abc
   ```

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

### Resetting Development Data

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

## Environment Variables

All required variables are documented in `.env.example`. Copy it to `.env` and provide your Firebase project values. The `.env` file is git-ignored and must never be committed.

## Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar, Footer, Layout wrapper
│   └── ui/              # Reusable UI components (Button, Card, Container, SectionTitle)
├── features/
│   └── booking/         # Booking feature module
│       ├── services/    # Firestore read/write functions
│       ├── utils/       # Validation, date helpers, slot generator
│       └── types.ts     # Booking-specific TypeScript types
├── pages/               # Route-level page components
├── lib/                 # Firebase initialisation
└── types/               # Shared TypeScript type definitions
scripts/
└── seedFirestore.ts     # Firestore development data seeder
docs/
└── FIRESTORE_SECURITY.md  # Firestore security rules design
```
