import {
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { FIRESTORE_COLLECTIONS } from '../booking/types'
import {
  onAuthChange,
  signInAdmin,
  signOutAdmin,
} from './services/authService'
import { AuthContext, type AuthContextValue } from './context'
import type { AdminUser, AdminUserDocument } from './types'

/**
 * Provides the current authentication state and the admin user document.
 *
 * Authentication initialization is considered complete only after:
 * 1. Firebase Auth has resolved the current user.
 * 2. If signed in, the users/{uid} Firestore document has been checked.
 *
 * This prevents RequireAdmin from redirecting an authenticated admin to
 * the public home page before the admin role has loaded.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [initializing, setInitializing] = useState(true)

  // Subscribe to Firebase Auth state.
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setFirebaseUser(user)

      // Keep initialization active until the Firestore user document
      // has also been resolved.
      if (!user) {
        setAdminUser(null)
        setInitializing(false)
      } else {
        setAdminUser(null)
        setInitializing(true)
      }
    })

    return unsubscribe
  }, [])

  // Subscribe to the user's Firestore document when signed in.
  useEffect(() => {
    if (!firebaseUser) {
      return
    }

    const ref = doc(
      db,
      FIRESTORE_COLLECTIONS.USERS,
      firebaseUser.uid,
    )

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setAdminUser(snap.data() as AdminUserDocument)
        } else {
          setAdminUser(null)
        }

        // Firebase Auth and Firestore user document have now both resolved.
        setInitializing(false)
      },
      () => {
        // If the Firestore lookup fails, do not leave the application
        // permanently stuck in the loading state.
        setAdminUser(null)
        setInitializing(false)
      },
    )

    return unsubscribe
  }, [firebaseUser])

  const signIn = useCallback(
    async (email: string, password: string) => {
      await signInAdmin(email, password)
    },
    [],
  )

  const signOut = useCallback(async () => {
    await signOutAdmin()
  }, [])

  const isAdmin = adminUser?.role === 'admin'

  const value: AuthContextValue = {
    firebaseUser,
    adminUser,
    initializing,
    isAdmin,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}