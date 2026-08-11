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
import type { AdminUser } from '../types'

/**
 * Sign in an admin with email + password credentials.
 */
export async function signInAdmin(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  console.log('[AUTH] signInAdmin: starting...')
  console.log('[AUTH] Email:', email)

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    )

    console.log('[AUTH] signInAdmin: Firebase login successful')
    console.log('[AUTH] UID:', credential.user.uid)

    return credential.user
  } catch (error) {
    console.error('[AUTH] signInAdmin: Firebase login failed:', error)
    throw error
  }
}

/**
 * Sign out the current user.
 */
export async function signOutAdmin(): Promise<void> {
  await signOut(auth)
}

/**
 * Configure session persistence before signing in.
 */
export async function setSessionPersistence(
  remember: boolean,
): Promise<Persistence> {
  const target = remember
    ? browserLocalPersistence
    : browserSessionPersistence

  console.log('[AUTH] setSessionPersistence: starting...')
  console.log('[AUTH] remember:', remember)

  try {
    await setPersistence(auth, target)

    console.log('[AUTH] setSessionPersistence: successful')

    return target
  } catch (error) {
    console.error(
      '[AUTH] setSessionPersistence: failed:',
      error,
    )
    throw error
  }
}

/**
 * Send a password-reset email.
 */
export async function sendPasswordReset(
  email: string,
): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

/**
 * Return the currently signed-in Firebase user.
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void,
): () => void {
  console.log('[AUTH] Registering auth state listener...')

  return onAuthStateChanged(auth, (user) => {
    console.log(
      '[AUTH] Auth state changed:',
      user ? user.email : 'SIGNED OUT',
    )

    callback(user)
  })
}

/**
 * Fetch the user document for a given UID.
 */
export async function getUserDoc(
  uid: string,
): Promise<AdminUser | null> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.USERS, uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    return null
  }

  return snap.data() as AdminUser
}

