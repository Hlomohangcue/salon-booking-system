import type { DayOfWeek } from '../../../booking/types'
import type { WorkingHours, WorkingHoursDay } from '../types'
import { WEEKDAY_KEYS, WEEKDAY_LABELS } from '../settingsValidation'

interface WorkingHoursEditorProps {
  /** Current working hours. */
  value: WorkingHours
  /** Called whenever any day's hours change. */
  onChange: (hours: WorkingHours) => void
  /** Whether a save is in flight. */
  disabled?: boolean
}

/**
 * Editor for the salon's per-weekday opening/closing hours.
 *
 * Presentation-only: mutates local `WorkingHours` state and reports changes via
 * `onChange`. Column headers are associated with inputs via aria-labels for
 * screen readers; each input announces itself as "Open time Monday", etc.
 */
export default function WorkingHoursEditor({
  value,
  onChange,
  disabled = false,
}: WorkingHoursEditorProps) {
  const updateDay = (key: DayOfWeek, patch: Partial<WorkingHoursDay>) => {
    onChange({
      ...value,
      [key]: { ...value[key], ...patch },
    })
  }

  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="sr-only">Working hours for each weekday</legend>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <span>Day</span>
          <span>Open</span>
          <span>Close</span>
          <span className="text-right">Closed</span>
        </div>
        <ul className="divide-y divide-gray-100">
          {WEEKDAY_KEYS.map((key) => {
            const day = value[key]
            return (
              <li
                key={key}
                className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-3 px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-700">{WEEKDAY_LABELS[key]}</span>

                <div>
                  <label htmlFor={`open-${key}`} className="sr-only">
                    Open time {WEEKDAY_LABELS[key]}
                  </label>
                  <input
                    id={`open-${key}`}
                    type="time"
                    value={day.open}
                    disabled={day.closed}
                    aria-disabled={day.closed}
                    aria-label={`Opening time ${WEEKDAY_LABELS[key]}`}
                    onChange={(e) => updateDay(key, { open: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  />
                </div>

                <div>
                  <label htmlFor={`close-${key}`} className="sr-only">
                    Close time {WEEKDAY_LABELS[key]}
                  </label>
                  <input
                    id={`close-${key}`}
                    type="time"
                    value={day.close}
                    disabled={day.closed}
                    aria-disabled={day.closed}
                    aria-label={`Closing time ${WEEKDAY_LABELS[key]}`}
                    onChange={(e) => updateDay(key, { close: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  />
                </div>

                <label className="flex items-center justify-end gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.closed}
                    aria-label={`Closed ${WEEKDAY_LABELS[key]}`}
                    onChange={(e) => updateDay(key, { closed: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-700 focus:ring-purple-600"
                  />
                  <span className="sr-only">{WEEKDAY_LABELS[key]} closed</span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>
    </fieldset>
  )
}
