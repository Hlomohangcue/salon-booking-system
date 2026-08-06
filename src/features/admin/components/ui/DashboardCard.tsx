import type { ReactNode } from 'react'

interface DashboardCardProps {
  /** Card title shown in the header. */
  title: string
  /** Optional description shown under the title. */
  description?: string
  /** Optional actions rendered on the right side of the header. */
  actions?: ReactNode
  /** Card body content. */
  children: ReactNode
  /** Optional container class overrides. */
  className?: string
}

/**
 * A titled card used across the admin dashboard and module pages.
 * Provides a consistent header (title + optional actions) and body.
 */
export default function DashboardCard({
  title,
  description,
  actions,
  children,
  className = '',
}: DashboardCardProps) {
  return (
    <section className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-display text-base font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}
