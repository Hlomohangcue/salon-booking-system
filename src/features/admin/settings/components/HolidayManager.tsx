import { useMemo } from 'react'
import { FormField, INPUT_CLASS, INPUT_ERROR_CLASS, CHECKBOX_CLASS } from './FormField'
import Button from '../../../../components/ui/Button'

/** A single holiday row in the editor. */
export interface HolidayRow {
  /** ISO date "YYYY-MM-DD". */
  date: string
  /** Human-readable name. */
  name: string
  /** Recurring flag. */
  recurring: boolean
}

interface HolidayManagerProps {
  /** Current holidays as ISO date-keyed entries. */
  holidays: HolidayRow[]
  /** Called when the list changes (add/remove/update). */
  onChange: (holidays: HolidayRow[]) => void
  /** Whether a save is in flight. */
  disabled?: boolean
  /** Per-field validation errors keyed by index + field. */
  fieldErrors?: Record<string, string | undefined>
}

/**
 * Editor for holidays / special closed days.
 *
 * Presentation-only. Holidays are stored as ISO dates (backward compatible with
 * the booking engine's `config.holidays` string array). Rows can be added,
 * edited, and removed. All persistence is handled upstream.
 */
export default function HolidayManager({
  holidays,
  onChange,
  disabled = false,
  fieldErrors,
}: HolidayManagerProps) {
  const sorted = useMemo(
    () => [...holidays].sort((a, b) => a.date.localeCompare(b.date)),
    [holidays],
  )

  const updateRow = (index: number, patch: Partial<HolidayRow>) => {
    onChange(
      holidays.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  const addRow = () => {
    onChange([
      ...holidays,
      { date: new Date().toISOString().slice(0, 10), name: '', recurring: true },
    ])
  }

  const removeRow = (index: number) => {
    onChange(holidays.filter((_, i) => i !== index))
  }

  return (
    <fieldset disabled={disabled} className="space-y-4">
      <legend className="sr-only">Holiday and closed-day management</legend>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Dates the salon is closed. Holidays are stored as ISO dates and feed the
          booking calendar.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={disabled}>
          + Add holiday
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400">No holidays added yet.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((row, index) => (
            <li
              key={row.date}
              className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto] items-end gap-3 border border-gray-200 rounded-xl p-3 sm:p-4"
            >
              <div>
                <FormField
                  id={`holiday-date-${row.date}`}
                  label="Date"
                  error={fieldErrors?.[`${row.date}.date`]}
                >
                  <input
                    id={`holiday-date-${row.date}`}
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(index, { date: e.target.value })}
                    aria-describedby={fieldErrors?.[`${row.date}.date`] ? `holiday-date-${row.date}-error` : undefined}
                    className={fieldErrors?.[`${row.date}.date`] ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  />
                </FormField>
              </div>

              <div>
                <FormField
                  id={`holiday-name-${row.date}`}
                  label="Name"
                  error={fieldErrors?.[`${row.date}.name`]}
                >
                  <input
                    id={`holiday-name-${row.date}`}
                    type="text"
                    value={row.name}
                    placeholder="e.g. Christmas Day"
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    aria-describedby={fieldErrors?.[`${row.date}.name`] ? `holiday-name-${row.date}-error` : undefined}
                    className={fieldErrors?.[`${row.date}.name`] ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  />
                </FormField>
              </div>

              <label className="flex items-center gap-2 pb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.recurring}
                  aria-label={`Recurring ${row.name || row.date}`}
                  onChange={(e) => updateRow(index, { recurring: e.target.checked })}
                  className={CHECKBOX_CLASS}
                />
                <span className="text-sm text-gray-600">Recurs yearly</span>
              </label>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(index)}
                disabled={disabled}
                aria-label={`Remove ${row.name || row.date}`}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  )
}
