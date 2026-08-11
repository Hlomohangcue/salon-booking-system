import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional fallback to render. Defaults to a friendly message. */
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Catches render errors in the subtree and shows a friendly fallback instead of
 * a blank/unstyled crash. Also logs the error so it is not silently swallowed.
 *
 * This is a class component because React error boundaries require the
 * `componentDidCatch`/`getDerivedStateFromError` lifecycle methods.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to the console in non-production; in production this would hook into
    // an error-reporting service (e.g. Sentry).
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[40vh] items-center justify-center px-4">
            <div className="max-w-md text-center">
              <h1 className="font-display text-2xl font-semibold text-gray-900">
                Something went wrong
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                An unexpected error occurred. Please reload the page to continue.
              </p>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-purple-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
              >
                Try again
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
