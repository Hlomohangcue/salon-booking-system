import { useLocation } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import Button from '../../../components/ui/Button'
import { ADMIN_NAV_ITEMS } from '../navigation'

interface TopBarProps {
  /** Called when the user opens the mobile drawer. */
  onMenuClick: () => void
}

/**
 * Admin top navigation bar.
 *
 * Shows a mobile menu toggle, a page context label, and the authenticated
 * admin's name with a sign-out action.
 */
export default function TopBar({ onMenuClick }: TopBarProps) {
  const { adminUser, signOut } = useAuth()
  const location = useLocation()
  const displayName = adminUser?.displayName ?? 'Admin'

  // Derive the current section label from the active admin nav item.
  const currentLabel =
    ADMIN_NAV_ITEMS.find((item) => item.path === location.pathname)?.label ??
    'Dashboard'

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6">
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-md text-gray-600 hover:text-purple-700 hover:bg-gray-50 transition-colors"
        aria-label="Open navigation menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Context label */}
      <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-900">Admin</span>
        <span aria-hidden="true">/</span>
        <span>{currentLabel}</span>
      </div>

      {/* Right side: admin identity + logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 leading-tight">{displayName}</p>
          <p className="text-xs text-gray-400 leading-tight">Administrator</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          Logout
        </Button>
      </div>
    </header>
  )
}
