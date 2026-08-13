import type { UserRole } from './types'

/** Roles that may access the admin dashboard and mutate protected resources. */
export const ADMIN_ROLES = ['admin', 'super_admin'] as const satisfies readonly UserRole[]

export type AdminRole = (typeof ADMIN_ROLES)[number]

/** Whether the given role grants admin-dashboard access. */
export function isAdminRole(role: UserRole | string | undefined | null): role is AdminRole {
  return role === 'admin' || role === 'super_admin'
}
