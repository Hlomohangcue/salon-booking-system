import Button from '../../../../components/ui/Button'
import { formatDisplayDate, formatTime12h } from '../../utils/dateHelpers'

interface TimeStepProps {
  slots: string[]
  loading: boolean
  error: string | null
  selectedDate: string | undefined
  selectedTime: string | undefined
  onSelect: (time: string) => void
  canGoNext: boolean
  onNext: () => void
  onBack: () => void
}

export default function TimeStep({
  slots,
  loading,
  error,
  selectedDate,
  selectedTime,
  onSelect,
  canGoNext,
  onNext,
  onBack,
}: TimeStepProps) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-gray-900 mb-1">Select a Time</h2>
      {selectedDate && (
        <p className="text-purple-700 text-sm font-medium mb-1">{formatDisplayDate(selectedDate)}</p>
      )}
      <p className="text-gray-500 text-sm mb-6">Choose an available time slot for your appointment.</p>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" role="status" aria-label="Loading time slots" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {!loading && !error && slots.length === 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-center mb-6">
          <p className="text-amber-800 font-medium text-sm mb-1">No available slots</p>
          <p className="text-amber-600 text-xs">
            There are no remaining time slots for this date. Please go back and choose a different date.
          </p>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-8" role="group" aria-label="Available time slots">
          {slots.map((slot) => {
            const selected = slot === selectedTime
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onSelect(slot)}
                aria-pressed={selected}
                className={[
                  'rounded-lg border-2 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600',
                  selected
                    ? 'border-purple-600 bg-purple-700 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50',
                ].join(' ')}
              >
                {formatTime12h(slot)}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-between mt-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!canGoNext}>Continue</Button>
      </div>
    </div>
  )
}
