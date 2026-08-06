import Button from '../../../../components/ui/Button'
import type { WizardData } from '../../hooks/useBooking'
import type { Service } from '../../types'
import { formatDisplayDate, formatTime12h } from '../../utils/dateHelpers'

interface ReviewStepProps {
  data: Partial<WizardData>
  services: Service[]
  onBack: () => void
  /** Triggers the booking submission. */
  onConfirm: () => void
  /** True while the booking write is in-flight — disables the Confirm button. */
  submitting?: boolean
  /** User-friendly error message to display when the submission fails. */
  submitError?: string | null
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-900 text-sm font-medium text-right max-w-xs">{value}</span>
    </div>
  )
}

export default function ReviewStep({
  data,
  services,
  onBack,
  onConfirm,
  submitting = false,
  submitError = null,
}: ReviewStepProps) {
  const service = services.find((s) => s.serviceId === data.serviceId)

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-gray-900 mb-1">Review Your Booking</h2>
      <p className="text-gray-500 text-sm mb-6">Please confirm the details below before submitting.</p>

      {/* Appointment details */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">Appointment</p>
        <ReviewRow label="Service" value={service?.name ?? data.serviceName ?? '—'} />
        <ReviewRow label="Duration" value={`${data.serviceDuration ?? service?.durationMinutes ?? '—'} minutes`} />
        <ReviewRow label="Starting from" value={`M${data.priceFrom ?? service?.priceFrom ?? '—'}`} />
        <ReviewRow label="Date" value={data.preferredDate ? formatDisplayDate(data.preferredDate) : '—'} />
        <ReviewRow label="Time" value={data.preferredTime ? formatTime12h(data.preferredTime) : '—'} />
      </div>

      {/* Customer details */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">Your Details</p>
        <ReviewRow label="Name" value={data.customerName ?? '—'} />
        <ReviewRow label="Phone" value={data.phoneNumber ?? '—'} />
        {data.email && <ReviewRow label="Email" value={data.email} />}
        {data.notes && <ReviewRow label="Notes" value={data.notes} />}
      </div>

      {/* Inline submission error */}
      {submitError && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6 flex gap-3"
        >
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
          </svg>
          <p className="text-red-700 text-sm font-medium">{submitError}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button onClick={onConfirm} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  )
}
