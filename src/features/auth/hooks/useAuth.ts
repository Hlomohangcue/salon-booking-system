import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../context'

/**
 * Access the current authentication state within the AuthProvider.
 * Must be used inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
