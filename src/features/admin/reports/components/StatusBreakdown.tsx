import type { StatusSummaryRow } from '../types'

interface StatusBreakdownProps {
  rows: StatusSummaryRow[]
}

/**
 * A visual status breakdown with percentage bars.
 * Uses the same colour palette as StatusBadge.
 */
export default function StatusBreakdown({ rows }: StatusBreakdownProps) {
  if (rows.length === 0) return null

  const total = rows.reduce((sum, r) => sum + r.count, 0)
  if (total === 0) return null

  return (
    <div className="space-y-3" role="list" aria-label="Booking status breakdown">
      {rows.map((row) => (
        <div key={row.status} role="listitem" className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium">{row.label}</span>
            <span className="text-gray-500">
              {row.count} ({row.share}%)
            </span>
          </div>

          {/* Bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden" aria-hidden="true">
            <div
              className={[
                'h-full rounded-full transition-all',
                row.status === 'completed'
                  ? 'bg-emerald-500'
                  : row.status === 'confirmed'
                    ? 'bg-blue-500'
                    : row.status === 'pending'
                      ? 'bg-amber-400'
                      : row.status === 'cancelled'
                        ? 'bg-red-400'
                        : 'bg-gray-400',
              ].join(' ')}
              style={{ width: `${row.share}%` }}
              aria-label={`${row.label}: ${row.share}%`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
