import type { ReactNode } from 'react'

interface EmptyStateProps {
  /** Short title describing the empty state. */
  title: string
  /** Optional supporting description. */
  description?: string
  /** Optional action (e.g. a Button) rendered below the text. */
  action?: ReactNode
  /** Optional icon rendered above the title. */
  icon?: ReactNode
}

/**
 * Reusable empty-state placeholder shown when a list/table has no data.
 * Used by the admin module pages (Bookings, Services, Customers, etc.).
 */
export default function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
