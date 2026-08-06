import {
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { FIRESTORE_COLLECTIONS } from '../booking/types'
import { signInAdmin, signOutAdmin } from './services/authService'
import { AuthContext, type AuthContextValue } from './context'
import type { AdminUser, AdminUserDocument } from './types'

/**
 * Provides the current authentication state and the admin user document.
 * Subscribes to Firebase Auth (onAuthStateChanged) and the user's Firestore
 * document (users/{uid}) to keep the role in sync.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [initializing, setInitializing] = useState(true)

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setAdminUser(null)
      setInitializing(false)
    })
    return unsubscribe
  }, [])

  // Subscribe to the user's Firestore document (users/{uid}) when signed in
  useEffect(() => {
    if (!firebaseUser) return
    const ref = doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid)
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setAdminUser(snap.data() as AdminUserDocument)
      } else {
        setAdminUser(null)
      }
    })
    return unsubscribe
  }, [firebaseUser])

  const signIn = useCallback(async (email: string, password: string) => {
    await signInAdmin(email, password)
  }, [])

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

return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
