import { describe, it, expect } from 'vitest'
import { isAdminRole, ADMIN_ROLES } from '../roles'

describe('isAdminRole', () => {
  it('accepts admin and super_admin', () => {
    expect(isAdminRole('admin')).toBe(true)
    expect(isAdminRole('super_admin')).toBe(true)
  })

  it('rejects customer and unknown roles', () => {
    expect(isAdminRole('customer')).toBe(false)
    expect(isAdminRole('staff')).toBe(false)
    expect(isAdminRole(undefined)).toBe(false)
    expect(isAdminRole(null)).toBe(false)
  })

  it('exports both dashboard roles', () => {
    expect(ADMIN_ROLES).toEqual(['admin', 'super_admin'])
  })
})
