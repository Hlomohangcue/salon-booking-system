import { auth, db } from '../../../lib/firebase'
import {
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
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
 * Fetch the user document for a given UID from the `users` collection.
 * Returns null if no such document exists (e.g. the account was not provisioned).
 */
export async function getUserDoc(uid: string): Promise<AdminUser | null> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.USERS, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as AdminUserDocument
}
