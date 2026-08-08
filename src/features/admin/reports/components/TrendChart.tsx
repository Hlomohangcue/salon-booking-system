import type { TrendPoint } from '../types'

interface TrendChartProps {
  /** Chart title (used in aria-label). */
  title: string
  /** Data points ordered by date. */
  data: TrendPoint[]
  /** The key to plot on the Y axis. */
  valueKey: 'bookings' | 'revenue'
  /** Format the Y-axis value, e.g. ("M12,500" or "14"). */
  formatValue?: (value: number) => string
  /** Optional class name. */
  className?: string
  /** Colour for the line/stroke. */
  lineColor?: string
}

/**
 * Accessible, lightweight SVG line chart for trends.
 *
 * Accessibility:
 *  - `role="img"` with a descriptive `aria-label`.
 *  - The chart is accompanied by a DataTable fallback on the page.
 */
export default function TrendChart({
  title,
  data,
  valueKey,
  formatValue = (v) => String(v),
  className = '',
  lineColor = 'stroke-purple-600',
}: TrendChartProps) {
  const padding = { top: 20, right: 10, bottom: 30, left: 50 }
  const width = 600
  const height = 200
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  if (data.length === 0) return null

  const values = data.map((d) => d[valueKey])
  const maxValue = Math.max(...values, 1)

  // Build the polyline points.
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0
  const points = data
    .map((d, i) => {
      const x = i === 0 ? 0 : i * stepX
      const y = plotHeight - (d[valueKey] / maxValue) * plotHeight
      return `${x + padding.left},${y + padding.top}`
    })
    .join(' ')

  // Y-axis ticks.
  const yTicks = 4
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxValue / yTicks) * i),
  )

  // X-axis labels — show a subset to avoid crowding.
  const xLabelInterval = Math.max(1, Math.floor(data.length / 8))

  return (
    <div className={className}>
      <svg
        role="img"
        aria-label={`${title} line chart with ${data.length} data points`}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <text x="0" y="12" className="text-xs fill-gray-500" aria-hidden="true">
          {title}
        </text>

        {/* Y-axis grid lines + labels */}
        {yTickValues.map((tick, i) => {
          const y = padding.top + plotHeight - (tick / maxValue) * plotHeight
          return (
            <g key={`y-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                className="stroke-gray-100"
                strokeWidth="1"
                aria-hidden="true"
              />
              <text
                x={padding.left - 6}
                y={y + 3}
                className="text-[10px] fill-gray-400 text-right"
                textAnchor="end"
                aria-hidden="true"
              >
                {formatValue(tick)}
              </text>
            </g>
          )
        })}

        {/* Line */}
        <polyline
          points={points}
          className={`${lineColor} fill-none`}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          aria-hidden="true"
        />

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % xLabelInterval !== 0 && i !== data.length - 1) return null
          const x = i === 0 ? 0 : i * stepX
          return (
            <text
              key={d.dateISO}
              x={x + padding.left}
              y={height - 6}
              className="text-[10px] fill-gray-400"
              textAnchor="middle"
              aria-hidden="true"
            >
              {d.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
