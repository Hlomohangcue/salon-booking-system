export interface BarChartBar {
  label: string
  value: number
  /** Optional colour class override (default: purple-600). */
  color?: string
}

interface BarChartProps {
  /** Chart title (used in aria-label). */
  title: string
  /** Bars to render, ordered as they should appear. */
  bars: BarChartBar[]
  /** Maximum value for the scale — auto-calculated if omitted. */
  maxValue?: number
  /** Format the value label, e.g. ("M12,500" or "14 bookings"). */
  formatValue?: (value: number) => string
  /** Optional class name. */
  className?: string
}

/**
 * Accessible, lightweight horizontal bar chart rendered as inline SVG.
 *
 * Accessibility:
 *  - `role="img"` with a descriptive `aria-label`.
 *  - Each bar is labelled with `aria-label` for its value.
 *  - The chart is accompanied by a DataTable fallback on the page.
 */
export default function BarChart({
  title,
  bars,
  maxValue,
  formatValue = (v) => String(v),
  className = '',
}: BarChartProps) {
  const max = maxValue ?? Math.max(...bars.map((b) => b.value), 1)
  const barHeight = 24
  const gap = 8
  const labelWidth = 100
  const chartWidth = 600
  const valueWidth = 60

  if (bars.length === 0) return null

  return (
    <div className={className}>
      <svg
        role="img"
        aria-label={`${title} bar chart with ${bars.length} bars`}
        width="100%"
        height={bars.length * (barHeight + gap)}
        viewBox={`0 0 ${chartWidth} ${bars.length * (barHeight + gap)}`}
        className="w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <text x="0" y="-4" className="text-xs fill-gray-500" aria-hidden="true">
          {title}
        </text>

        {bars.map((bar, i) => {
          const y = i * (barHeight + gap)
          const barWidth = (bar.value / max) * (chartWidth - labelWidth - valueWidth - 20)

          return (
            <g key={bar.label}>
              {/* Label */}
              <text
                x="0"
                y={y + barHeight / 2 + 4}
                className="text-xs fill-gray-700"
                aria-hidden="true"
              >
                {bar.label}
              </text>

              {/* Bar */}
              <rect
                x={labelWidth}
                y={y}
                width={Math.max(barWidth, 4)}
                height={barHeight}
                rx="4"
                className={bar.color ?? 'fill-purple-600'}
                aria-label={`${bar.label}: ${formatValue(bar.value)}`}
              />

              {/* Value */}
              <text
                x={labelWidth + Math.max(barWidth, 4) + 6}
                y={y + barHeight / 2 + 4}
                className="text-xs fill-gray-600"
                aria-hidden="true"
              >
                {formatValue(bar.value)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
