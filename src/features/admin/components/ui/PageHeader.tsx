import type { ReactNode } from 'react'

interface PageHeaderProps {
  /** Page eyebrow label (small uppercase text). */
  eyebrow?: string
  /** Main page title. */
  title: string
  /** Optional description under the title. */
  description?: string
  /** Optional actions rendered on the right (e.g. a primary button). */
  actions?: ReactNode
}

/**
 * Consistent page header used by every admin module page.
 * Renders an optional eyebrow, title, description, and right-aligned actions.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-purple-700 text-xs font-semibold uppercase tracking-widest mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
      </div>
      {actions && <div className="shrink-0 flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
