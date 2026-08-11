import { auth, db } from '../../../lib/firebase'
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  type User as FirebaseUser,
  type Persistence,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { FIRESTORE_COLLECTIONS } from '../../booking/types'
import type { AdminUser, AdminUserDocument } from '../types'

/**
 * Sign in an admin with email + password credentials.
 * Throws on invalid credentials or network errors.
 */
export async function signInAdmin(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

/** Sign out the current user. */
export async function signOutAdmin(): Promise<void> {
  await signOut(auth)
}

/**
 * Configure session persistence BEFORE signing in.
 *
 * - `true`  → browserLocalPersistence (survives browser restart — "remember me")
 * - `false` → browserSessionPersistence (cleared when the tab closes)
 *
 * Call this before `signInAdmin` to apply the chosen persistence level. The
 * Firebase default is browserLocalPersistence, so this is only needed when the
 * user unchecks "remember me".
 */
export async function setSessionPersistence(remember: boolean): Promise<Persistence> {
  const target = remember ? browserLocalPersistence : browserSessionPersistence
  await setPersistence(auth, target)
  return target
}

/**
 * Send a password-reset email to the given address.
 * Throws if the email is not associated with an account.
 */
export async function sendPasswordReset(
  email: string,
): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

/**
 * Return the currently signed-in Firebase user, or null.
 * This is a one-shot read; use `onAuthStateChanged` for live updates.
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 * This is what AuthContext uses to keep the app in sync.
 */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback)
}

/**
 * Fetch the user document for a given UID from the `users` collection.
 * Returns null if no such document exists (e.g. the account was not provisioned).
 */
export async function getUserDoc(uid: string): Promise<AdminUser | null> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.USERS, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as AdminUserDocument
}
