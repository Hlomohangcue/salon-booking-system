import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { ReactElement, ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '../../features/auth/context'
import { makeAuthValue } from '../mocks/auth'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Route(s) to seed the MemoryRouter with. */
  route?: string
  /** Optional auth context value; defaults to an authenticated admin. */
  authValue?: AuthContextValue
  /** Wrap children in an AuthProvider using the provided auth value. */
  withAuth?: boolean
}

/**
 * Render a component within the providers it needs (Router + optional Auth).
 * Defaults to an authenticated admin so admin components render without extra
 * setup. Pass `withAuth: false` to test the signed-out / unauthenticated case.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    authValue,
    withAuth = true,
    ...renderOptions
  }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    const content = withAuth ? (
      <AuthContext.Provider value={authValue ?? makeAuthValue()}>
        {children}
      </AuthContext.Provider>
    ) : (
      children
    )
    return <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
