/**
 * Create (or promote) an admin account using the Firebase Admin SDK.
 *
 * Run with: npm run create-admin
 *
 * This is the production-grade admin bootstrap. It uses a service account
 * (Firebase Admin SDK) so it can create an Auth user AND write the matching
 * users/{uid} document with role: 'admin' — bypassing client security rules,
 * which correctly forbid self-promotion.
 *
 * Credentials are read from the environment (never hardcoded):
 *   ADMIN_EMAIL     - admin email address (required)
 *   ADMIN_PASSWORD  - admin password (required, min 6 chars)
 *   ADMIN_NAME      - display name (optional, defaults to email local-part)
 *
 * If any required variable is missing, the script prompts interactively using
 * the Node.js readline API.
 *
 * Idempotency:
 *   - If the Auth user already exists, it is reused (no duplicate).
 *   - If users/{uid} already exists with role 'admin', nothing is overwritten.
 *   - If users/{uid} exists with a non-admin role, it is promoted to admin
 *     only when --force is passed; otherwise it errors out to avoid
 *     unintentionally overwriting an existing account.
 *   - The generated password is never stored in source code.
 */

import { config } from 'dotenv'
import { initializeApp, deleteApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

config()

// ─── Environment helpers ────────────────────────────────────────────────────

function fail(message: string): never {
  console.error(`\n❌ ${message}`)
  process.exit(1)
}

async function prompt(query: string, hide = false): Promise<string> {
  const rl = createInterface({ input, output })
  try {
    if (hide) {
      // A minimal hidden-input shim: read a line normally. Hidden echo is not
      // supported by node:readline/promises, so we prompt with a note instead.
      console.log('  (password will be echoed in the terminal during input)')
    }
    const answer = await rl.question(`  ${query}: `)
    return answer.trim()
  } finally {
    rl.close()
  }
}

/**
 * Resolve a credential value from the environment, falling back to an
 * interactive prompt. Returns empty string when both are unavailable.
 */
async function resolveCredential(
  envKey: string,
  label: string,
  required: boolean,
  hide = false,
): Promise<string> {
  const fromEnv = process.env[envKey]?.trim() ?? ''
  if (fromEnv) {
    console.log(`  ✓ ${label}: read from ${envKey}`)
    return fromEnv
  }
  if (!required) return ''
  const answer = await prompt(`${label} (${envKey})`, hide)
  if (!answer) fail(`${envKey} is required.`)
  return answer
}

// ─── Service account loading ────────────────────────────────────────────────

/**
 * Initialise the Firebase Admin SDK from a service account key file.
 *
 * Resolves the key path from (in priority order):
 *   1. GOOGLE_APPLICATION_CREDENTIALS (standard GCP env var)
 *   2. FIREBASE_SERVICE_ACCOUNT
 *   3. ./service-account.json in the project root
 */
function loadServiceAccountPath(): string {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
    process.env.FIREBASE_SERVICE_ACCOUNT?.trim(),
  ].filter((p): p is string => Boolean(p))

const rootCandidate = 'service-account.json'
  if (candidates.length === 0) {
    // Prefer the explicit env vars; fall back to a root file.
    try {
      readFileSync(rootCandidate, 'utf8')
      candidates.push(rootCandidate)
    } catch {
      // no root service-account.json — handled below
    }
  }

  if (candidates.length === 0) {
    fail(
      'No service account key found. Set GOOGLE_APPLICATION_CREDENTIALS or ' +
        'FIREBASE_SERVICE_ACCOUNT to the path of your service account JSON, ' +
        'or place service-account.json in the project root.',
    )
  }

  return candidates[0] as string
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🔐 Makeng Salon — Create Admin Account\n')

  const serviceAccountPath = loadServiceAccountPath()
  console.log(`  Using service account: ${serviceAccountPath}`)

  const email = await resolveCredential('ADMIN_EMAIL', 'Admin email', true)
  const password = await resolveCredential('ADMIN_PASSWORD', 'Admin password', true, true)
  const displayName = await resolveCredential('ADMIN_NAME', 'Display name', false)

  if (password.length < 6) {
    fail('Password must be at least 6 characters.')
  }

  const app = initializeApp({
    credential: cert(serviceAccountPath),
  })

  try {
    const adminAuth = getAuth(app)
    const adminDb = getFirestore(app)

    // 1. Create (or reuse) the Auth user.
    let uid: string
    try {
      const existing = await adminAuth.getUserByEmail(email)
      uid = existing.uid
      console.log(`  ✓ Auth user already exists: ${email} (${uid})`)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code && String(code).includes('auth/user-not-found')) {
        const created = await adminAuth.createUser({
          email,
          password,
          displayName: displayName || email.split('@')[0],
        })
        uid = created.uid
        console.log(`  ✓ Auth user created: ${email} (${uid})`)
      } else {
        fail(`Failed to look up/create Auth user: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // 2. Write users/{uid} with role: 'admin'.
    const userRef = adminDb.collection('users').doc(uid)
    const existingDoc = await userRef.get()

    if (existingDoc.exists) {
      const existingRole = existingDoc.data()?.role
      if (existingRole === 'admin') {
        console.log(`  ✓ users/${uid} already has role 'admin' — nothing to do. (idempotent)`)
      } else {
        // Promote only with --force. Prevents unintentional overwrites.
        const force = process.argv.includes('--force')
        if (!force) {
          fail(
            `users/${uid} exists with role '${String(existingRole)}'. ` +
              'Refusing to overwrite. Re-run with --force to promote this account to admin.',
          )
        }
        await userRef.set(
          {
            uid,
            email,
            displayName: displayName || existingDoc.data()?.displayName || email.split('@')[0],
            role: 'admin',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
        console.log(`  ✓ users/${uid} promoted to role 'admin'.`)
      }
    } else {
      await userRef.set({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        role: 'admin',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      console.log(`  ✓ users/${uid} created with role 'admin'.`)
    }

    console.log('\n✅ Admin account ready.')
    console.log('   Sign in at /admin/login with the configured email + password.\n')
  } finally {
    await deleteApp(app)
  }
}

main().catch((err: unknown) => {
  console.error('\n❌ create-admin failed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
