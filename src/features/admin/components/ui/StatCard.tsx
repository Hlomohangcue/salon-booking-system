import type { ReactNode } from 'react'

interface StatCardProps {
  /** Short label describing the metric, e.g. "Today's Appointments". */
  label: string
  /** Primary numeric or text value. */
  value: string
  /** Optional secondary helper text under the value. */
  hint?: string
  /** Optional icon rendered in the top-right corner. */
  icon?: ReactNode
  /** Accent colour for the icon container. */
  accent?: 'purple' | 'blue' | 'emerald' | 'amber'
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps['accent']>, string> = {
  purple: 'bg-purple-50 text-purple-700',
  blue: 'bg-blue-50 text-blue-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
}

export default function StatCard({
  label,
  value,
  hint,
  icon,
  accent = 'purple',
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        {icon && (
          <div
            className={['w-11 h-11 rounded-xl flex items-center justify-center shrink-0', ACCENT_STYLES[accent]].join(' ')}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
