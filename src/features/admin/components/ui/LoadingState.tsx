interface LoadingStateProps {
  /** Accessible label announced by screen readers. */
  label?: string
}

/**
 * Reusable loading placeholder for admin data sections.
 * Shows a spinner with an optional accessible label.
 */
export default function LoadingState({ label = 'Loading' }: LoadingStateProps) {
  return (
    <div
      className="flex items-center justify-center py-12"
      role="status"
      aria-label={label}
    >
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" />
    </div>
  )
}
