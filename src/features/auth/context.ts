import { createContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import type { AdminUser } from './types'

export interface AuthContextValue {
  /** The current Firebase Auth user, or null when signed out. */
  firebaseUser: FirebaseUser | null
  /** The admin user document (users/{uid}), or null when signed out / not provisioned. */
  adminUser: AdminUser | null
  /** True once the initial auth state has been resolved. */
  initializing: boolean
  /** True when the authenticated user is an admin. */
  isAdmin: boolean
  /** Sign in with email + password. */
  signIn: (email: string, password: string) => Promise<void>
  /** Sign out the current user. */
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
