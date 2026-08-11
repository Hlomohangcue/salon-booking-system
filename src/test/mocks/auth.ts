import { vi } from 'vitest'
import type { AuthContextValue } from '../../features/auth/context'
import type { AdminUser } from '../../features/auth/types'

/**
 * Build a mock AuthContextValue for use in component tests.
 * Components that call `useAuth()` can be wrapped with this value via the
 * AuthContext.Provider.
 */
export function makeAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  const adminUser: AdminUser = {
    uid: 'admin-1',
    email: 'admin@makengsalon.com',
    displayName: 'Admin',
    role: 'admin',
  }
  return {
    firebaseUser: null,
    adminUser,
    initializing: false,
    isAdmin: true,
    signIn: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    ...overrides,
  }
}

/** Mock the `firebase/auth` module for authService tests. */
export function mockFirebaseAuth() {
  return {
    getAuth: vi.fn(() => ({ currentUser: null })),
    signInWithEmailAndPassword: vi.fn(async (_auth, _email, _password) => ({
      user: { uid: 'admin-1', email: 'admin@makengsalon.com' },
    })),
    signOut: vi.fn(async () => {}),
    setPersistence: vi.fn(async (_auth, _persistence) => _persistence),
    browserLocalPersistence: { type: 'local' },
    browserSessionPersistence: { type: 'session' },
    sendPasswordResetEmail: vi.fn(async () => {}),
    onAuthStateChanged: vi.fn((_auth, cb: (user: unknown) => void) => {
      cb(null)
      return () => {}
    }),
  }
}
