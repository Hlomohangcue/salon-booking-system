import type { ComponentType } from 'react'
import type { UserRole } from '../auth/types'
import { ADMIN_ROLES } from '../auth/roles'
import {
  DashboardIcon,
  CalendarIcon,
  SparklesIcon,
  UsersIcon,
  ChartIcon,
  SettingsIcon,
  GalleryIcon,
} from './navigationIcons'

/**
 * A single entry in the admin navigation sidebar.
 * `roles` drives future role-based access control — currently only "admin"
 * exists, but the property is forward-compatible with additional roles.
 */
export interface AdminNavItem {
  /** Human-readable label shown in the sidebar. */
  label: string
  /** Route path (relative to /admin). */
  path: string
  /** Accessor icon component rendered by the sidebar. */
  icon: ComponentType<{ className?: string }>
  /** Roles allowed to see/access this item. */
  roles: UserRole[]
}

/**
 * Central admin navigation definition — single source of truth consumed by
 * the sidebar and (in future) breadcrumbs / page titles.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin',
    roles: [...ADMIN_ROLES],
    icon: DashboardIcon,
  },
  {
    label: 'Bookings',
    path: '/admin/bookings',
    roles: [...ADMIN_ROLES],
    icon: CalendarIcon,
  },
  {
    label: 'Services',
    path: '/admin/services',
    roles: [...ADMIN_ROLES],
    icon: SparklesIcon,
  },
  {
    label: 'Gallery',
    path: '/admin/gallery',
    roles: [...ADMIN_ROLES],
    icon: GalleryIcon,
  },
  {
    label: 'Customers',
    path: '/admin/customers',
    roles: [...ADMIN_ROLES],
    icon: UsersIcon,
  },
  {
    label: 'Reports',
    path: '/admin/reports',
    roles: [...ADMIN_ROLES],
    icon: ChartIcon,
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    roles: [...ADMIN_ROLES],
    icon: SettingsIcon,
  },
]
