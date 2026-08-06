import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router'
import { ADMIN_NAV_ITEMS } from '../navigation'
import type { UserRole } from '../../auth/types'

interface SidebarProps {
  /** The current user's role, used to filter nav items. */
  role: UserRole | undefined
  /** Whether the mobile drawer is open. */
  open: boolean
  /** Called when the user navigates via a link (closes the mobile drawer). */
  onNavigate: () => void
}

/**
 * Admin sidebar navigation.
 *
 * On desktop it renders as a fixed, always-visible rail. On mobile it renders
 * as an overlay drawer controlled by the `open` prop. Active links are
 * highlighted using NavLink's location matching.
 */
export default function Sidebar({ role, open, onNavigate }: SidebarProps) {
  const navRef = useRef<HTMLElement>(null)
  const items = ADMIN_NAV_ITEMS.filter(
    (item) => !role || item.roles.includes(role),
  )

  // Move focus into the sidebar when the mobile drawer opens so keyboard and
  // screen-reader users land on the navigation.
  useEffect(() => {
    if (open) {
      navRef.current?.focus()
    }
  }, [open])

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 md:hidden"
          onClick={onNavigate}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-300 flex flex-col transition-transform duration-200',
          'md:translate-x-0 md:static md:shrink-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <span className="font-display text-lg font-semibold text-white">
            Makeng<span className="text-purple-400"> Admin</span>
          </span>
        </div>

        {/* Navigation */}
        <nav
          ref={navRef}
          aria-label="Admin navigation"
          tabIndex={open ? -1 : undefined}
          className="flex-1 py-4 overflow-y-auto"
        >
          <ul className="space-y-1 px-3">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/admin'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-purple-700 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                        <span aria-current={isActive ? 'page' : undefined}>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 text-xs text-gray-500">
          Makeng Salon &middot; Admin
        </div>
      </aside>
    </>
  )
}
