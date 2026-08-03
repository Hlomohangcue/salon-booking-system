import { useState } from 'react'
import { addDays } from 'date-fns'
import { formatDateStr, getDayOfWeek, isDateInPast, isDateWithinWindow, isHoliday } from '../../utils/dateHelpers'
import Button from '../../../../components/ui/Button'
import type { BookingConfig } from '../../types'

const DAY_ABBREVS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function buildCalendarGrid(year: number, month: number): (string | null)[] {
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const grid: (string | null)[] = []

  for (let i = 0; i < firstDayOfWeek; i++) grid.push(null)

  for (let d = 1; d <= daysInMonth; d++) {
    grid.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    )
  }

  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

interface DateStepProps {
  config: BookingConfig | null
  configLoading: boolean
  selectedDate: string | undefined
  onSelect: (date: string) => void
  canGoNext: boolean
  onNext: () => void
  onBack: () => void
}

export default function DateStep({
  config,
  configLoading,
  selectedDate,
  onSelect,
  canGoNext,
  onNext,
  onBack,
}: DateStepProps) {
  const today = new Date()
  const [displayYear, setDisplayYear] = useState(today.getFullYear())
  const [displayMonth, setDisplayMonth] = useState(today.getMonth())

  const windowDays = config?.bookingWindowDays ?? 30
  const maxDate = addDays(today, windowDays)
  const maxYear = maxDate.getFullYear()
  const maxMonth = maxDate.getMonth()

  const canGoPrev =
    displayYear > today.getFullYear() ||
    (displayYear === today.getFullYear() && displayMonth > today.getMonth())

  const canGoNext2 =
    displayYear < maxYear ||
    (displayYear === maxYear && displayMonth < maxMonth)

  function prevMonth() {
    if (displayMonth === 0) { setDisplayYear((y) => y - 1); setDisplayMonth(11) }
    else setDisplayMonth((m) => m - 1)
  }

  function nextMonth() {
    if (displayMonth === 11) { setDisplayYear((y) => y + 1); setDisplayMonth(0) }
    else setDisplayMonth((m) => m + 1)
  }

  function isDisabled(dateStr: string): boolean {
    if (!config) return true
    if (isDateInPast(dateStr)) return true
    if (!isDateWithinWindow(dateStr, windowDays)) return true
    if (isHoliday(dateStr, config.holidays)) return true
    const dayConf = config.openingHours[getDayOfWeek(dateStr)]
    return !dayConf || dayConf.closed === true
  }

  const grid = buildCalendarGrid(displayYear, displayMonth)

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-gray-900 mb-1">Select a Date</h2>
      <p className="text-gray-500 text-sm mb-6">Choose an available date for your appointment.</p>

      {configLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" role="status" aria-label="Loading calendar" />
        </div>
      )}

      {!configLoading && (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            <h3 className="font-semibold text-gray-900 text-sm">
              {MONTH_NAMES[displayMonth]} {displayYear}
            </h3>

            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoNext2}
              aria-label="Next month"
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_ABBREVS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-px" role="grid" aria-label="Date picker">
            {grid.map((dateStr, i) => {
              if (!dateStr) {
                return <div key={`empty-${i}`} role="gridcell" aria-hidden="true" />
              }

              const disabled = isDisabled(dateStr)
              const selected = dateStr === selectedDate
              const isToday = dateStr === formatDateStr(today)

              return (
                <div key={dateStr} role="gridcell">
                  <button
                    type="button"
                    onClick={() => !disabled && onSelect(dateStr)}
                    disabled={disabled}
                    aria-label={dateStr}
                    aria-pressed={selected}
                    className={[
                      'w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      selected
                        ? 'bg-purple-700 text-white'
                        : disabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : isToday
                        ? 'text-purple-700 border border-purple-300 hover:bg-purple-50'
                        : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700',
                    ].join(' ')}
                  >
                    {parseInt(dateStr.slice(8), 10)}
                  </button>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Greyed-out dates are outside business hours, public holidays, or beyond the {windowDays}-day booking window.
          </p>
        </>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!canGoNext}>Continue</Button>
      </div>
    </div>
  )
}
