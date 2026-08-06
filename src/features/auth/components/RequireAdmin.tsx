import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'

/**
 * Route guard for admin-only pages.
 *
 * Behaviour:
 * - While the initial auth state is resolving → renders a loading fallback.
 * - When signed out → redirects to /admin/login (preserving the intended path).
 * - When signed in but not an admin → redirects to home.
 * - When signed in and an admin → renders the protected content.
 */
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { initializing, firebaseUser, isAdmin } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-8 h-8 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin"
          role="status"
          aria-label="Checking authentication"
        />
      </div>
    )
  }

  if (!firebaseUser) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
