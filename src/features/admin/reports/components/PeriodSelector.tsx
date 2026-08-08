import type { ReportPeriodPreset } from '../types'

interface PeriodSelectorProps {
  /** The currently active preset. */
  period: ReportPeriodPreset
  /** Called when the user selects a different period. */
  onChange: (preset: ReportPeriodPreset) => void
  /** The human-readable label for the resolved range. */
  rangeLabel: string
}

const PRESETS: { value: ReportPeriodPreset; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
  { value: 'all', label: 'All time' },
]

/**
 * A segmented control for picking the report period.
 * Reuses the same button styling as the admin UI kit.
 */
export default function PeriodSelector({
  period,
  onChange,
  rangeLabel,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div
        className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5"
        role="radiogroup"
        aria-label="Report period"
      >
        {PRESETS.map((preset) => {
          const isActive = period === preset.value
          return (
            <button
              key={preset.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(preset.value)}
              className={[
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600',
                isActive
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
              ].join(' ')}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
      <span className="text-sm text-gray-500" aria-live="polite">
        {rangeLabel}
      </span>
    </div>
  )
}
