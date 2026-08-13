import { HttpsError } from 'firebase-functions/v2/https'

const ADMIN_ROLES = new Set(['admin', 'super_admin'])

/**
 * Verifies that the caller is an authenticated admin using users/{uid}.role.
 * Accepts `admin` and elevated `super_admin`; does not invent a separate system.
 */
export async function assertAdmin(
  db: FirebaseFirestore.Firestore,
  uid: string | undefined,
): Promise<string> {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.')
  }

  const userSnap = await db.collection('users').doc(uid).get()
  const role = userSnap.data()?.role

  if (!userSnap.exists || typeof role !== 'string' || !ADMIN_ROLES.has(role)) {
    throw new HttpsError('permission-denied', 'Admin access is required.')
  }

  return uid
}
