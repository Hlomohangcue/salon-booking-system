/**
 * Firestore Development Seed Script
 * Run with: npm run seed
 *
 * Seeds the following collections:
 *   - services         (7 salon services)
 *   - settings         (bookingConfig singleton)
 *   - holidays         (Lesotho public holidays — development examples)
 *
 * Idempotent: uses stable document IDs so re-running produces the same state.
 * Safe to run multiple times during development.
 *
 * Requirements:
 *   - Fill in real Firebase credentials in .env before running.
 *   - Firestore must be in test mode OR security rules must allow the writes.
 */

import { config } from 'dotenv'
import { initializeApp, deleteApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore'

// Load .env from the project root
config()

// ─── Environment validation ────────────────────────────────────────────────

const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

const PLACEHOLDER_INDICATORS = ['your_', 'your-', 'xxxxxxx']

function validateEnv(): void {
  const missing: string[] = []
  const placeholder: string[] = []

  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key]
    if (!value) {
      missing.push(key)
      continue
    }
    const lower = value.toLowerCase()
    if (PLACEHOLDER_INDICATORS.some((p) => lower.includes(p))) {
      placeholder.push(key)
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ Missing environment variables:')
    missing.forEach((k) => console.error(`   ${k}`))
    console.error('\n   Copy .env.example to .env and fill in your Firebase credentials.\n')
    process.exit(1)
  }

  if (placeholder.length > 0) {
    console.error('\n❌ Placeholder values detected in .env — replace with real Firebase credentials:')
    placeholder.forEach((k) => console.error(`   ${k} = "${process.env[k]}"`))
    console.error('\n   Find these values in your Firebase project console → Project Settings.\n')
    process.exit(1)
  }
}

// ─── Seed data ─────────────────────────────────────────────────────────────

const NOW = Timestamp.now()

/**
 * Lesotho public holidays 2026 — seeded as development examples.
 * Verify and update these dates annually in the Firestore console.
 */
const HOLIDAY_DATES = [
  { date: '2026-01-01', name: "New Year's Day", recurring: true },
  { date: '2026-03-11', name: "Moshoeshoe's Day", recurring: true },
  { date: '2026-04-03', name: 'Good Friday', recurring: false },
  { date: '2026-04-06', name: 'Easter Monday', recurring: false },
  { date: '2026-05-01', name: "Workers' Day", recurring: true },
  { date: '2026-05-25', name: 'Africa Day', recurring: true },
  { date: '2026-07-17', name: "King Letsie III's Birthday", recurring: true },
  { date: '2026-10-04', name: 'Independence Day', recurring: true },
  { date: '2026-10-05', name: 'National Sports Day', recurring: true },
  { date: '2026-12-25', name: 'Christmas Day', recurring: true },
  { date: '2026-12-26', name: 'Boxing Day', recurring: true },
]

const HOLIDAY_DATE_STRINGS = HOLIDAY_DATES.map((h) => h.date)

const SERVICES = [
  {
    serviceId: 'haircut',
    name: 'Haircut',
    description: 'Precision cuts shaped to your face structure and lifestyle. Includes wash and blow-dry.',
    durationMinutes: 45,
    priceFrom: 150, // LSL — placeholder, update with actual pricing
    category: 'hair',
    isActive: true,
    sortOrder: 1,
    createdAt: NOW,
  },
  {
    serviceId: 'hair-styling',
    name: 'Hair Styling',
    description: 'Professional blow-outs, curls, and occasion styles that last. Perfect for any event.',
    durationMinutes: 60,
    priceFrom: 200,
    category: 'hair',
    isActive: true,
    sortOrder: 2,
    createdAt: NOW,
  },
  {
    serviceId: 'hair-coloring',
    name: 'Hair Coloring',
    description: 'Full colour, highlights, balayage, or ombré. Vibrant results with colour-safe products.',
    durationMinutes: 120,
    priceFrom: 350,
    category: 'hair',
    isActive: true,
    sortOrder: 3,
    createdAt: NOW,
  },
  {
    serviceId: 'braiding',
    name: 'Braiding',
    description: 'Box braids, cornrows, knotless braids, and more. Durable, neat, and beautifully finished.',
    durationMinutes: 180,
    priceFrom: 300,
    category: 'hair',
    isActive: true,
    sortOrder: 4,
    createdAt: NOW,
  },
  {
    serviceId: 'hair-treatment',
    name: 'Hair Treatment',
    description: 'Deep conditioning and repair treatments to restore moisture, strength, and shine.',
    durationMinutes: 60,
    priceFrom: 250,
    category: 'hair',
    isActive: true,
    sortOrder: 5,
    createdAt: NOW,
  },
  {
    serviceId: 'beard-grooming',
    name: 'Beard Grooming',
    description: 'Shape, trim, and condition your beard to perfection. Includes hot towel and beard oil.',
    durationMinutes: 30,
    priceFrom: 100,
    category: 'beard',
    isActive: true,
    sortOrder: 6,
    createdAt: NOW,
  },
  {
    serviceId: 'makeup',
    name: 'Makeup',
    description: 'Full glam or natural everyday looks for any occasion, applied by experienced makeup artists.',
    durationMinutes: 60,
    priceFrom: 350,
    category: 'makeup',
    isActive: true,
    sortOrder: 7,
    createdAt: NOW,
  },
] as const

/**
 * Default booking configuration.
 * All times are in local time (Lesotho is UTC+2).
 * Update openingHours and holidays to match the real salon schedule.
 */
const BOOKING_CONFIG = {
  openingHours: {
    mon: { open: '08:00', close: '19:00' },
    tue: { open: '08:00', close: '19:00' },
    wed: { open: '08:00', close: '19:00' },
    thu: { open: '08:00', close: '19:00' },
    fri: { open: '08:00', close: '19:00' },
    sat: { open: '09:00', close: '18:00' },
    sun: { open: '10:00', close: '16:00' },
  },
  slotIntervalMins: 30,
  bookingWindowDays: 30,
  minAdvanceHours: 2,
  maxBookingsPerSlot: 1,
  holidays: HOLIDAY_DATE_STRINGS,
} as const

// ─── Seed functions ────────────────────────────────────────────────────────

async function seedServices(db: ReturnType<typeof getFirestore>): Promise<void> {
  console.log('  Seeding services...')
  const batch = writeBatch(db)

  for (const service of SERVICES) {
    const ref = doc(collection(db, 'services'), service.serviceId)
    // writeBatch.set is used (not setDoc) for atomic batch writes
    batch.set(ref, service)
  }

  await batch.commit()
  console.log(`  ✓ ${SERVICES.length} services written`)
}

async function seedBookingConfig(db: ReturnType<typeof getFirestore>): Promise<void> {
  console.log('  Seeding settings/bookingConfig...')
  const ref = doc(db, 'settings', 'bookingConfig')
  await setDoc(ref, BOOKING_CONFIG)
  console.log('  ✓ bookingConfig written')
}

async function seedHolidays(db: ReturnType<typeof getFirestore>): Promise<void> {
  console.log('  Seeding holidays...')
  const batch = writeBatch(db)

  for (const holiday of HOLIDAY_DATES) {
    const ref = doc(collection(db, 'holidays'), holiday.date)
    batch.set(ref, {
      ...holiday,
      // Flag that these are development examples — replace with real salon holidays
      _devSample: true,
      createdAt: NOW,
    })
  }

  await batch.commit()
  console.log(`  ✓ ${HOLIDAY_DATES.length} holidays written`)
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🌱 Makeng Salon — Firestore Seed Script\n')

  validateEnv()

  const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  })

  const db = getFirestore(app)

  console.log(`  Project: ${process.env.VITE_FIREBASE_PROJECT_ID}\n`)

  try {
    await seedServices(db)
    await seedBookingConfig(db)
    await seedHolidays(db)

    console.log('\n✅ Seeding complete!')
    console.log('   Collections written:')
    console.log('     services        — 7 documents')
    console.log('     settings        — bookingConfig (1 document)')
    console.log('     holidays        — 11 documents (2026 Lesotho holidays)\n')
  } finally {
    await deleteApp(app)
  }
}

main().catch((err: unknown) => {
  console.error('\n❌ Seed failed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
