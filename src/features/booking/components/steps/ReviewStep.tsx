import Button from '../../../../components/ui/Button'
import type { WizardData } from '../../hooks/useBooking'
import type { Service } from '../../types'

interface ReviewStepProps {
  data: Partial<WizardData>
  services: Service[]
  onBack: () => void
  onConfirm: () => void
}

function format12h(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return `${days[d.getDay()]}, ${day} ${months[month - 1]} ${year}`
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-900 text-sm font-medium text-right max-w-xs">{value}</span>
    </div>
  )
}

export default function ReviewStep({ data, services, onBack, onConfirm }: ReviewStepProps) {
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
        <ReviewRow label="Time" value={data.preferredTime ? format12h(data.preferredTime) : '—'} />
      </div>

      {/* Customer details */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">Your Details</p>
        <ReviewRow label="Name" value={data.customerName ?? '—'} />
        <ReviewRow label="Phone" value={data.phoneNumber ?? '—'} />
        {data.email && <ReviewRow label="Email" value={data.email} />}
        {data.notes && <ReviewRow label="Notes" value={data.notes} />}
      </div>

      {/* Phase 3.3 notice */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6 flex gap-3">
        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-amber-800 text-sm font-semibold">Booking submission coming in Phase 3.3</p>
          <p className="text-amber-700 text-xs mt-0.5">
            The "Confirm" button will write your booking to Firestore and send a confirmation once Phase 3.3 is implemented.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onConfirm}>
          Confirm Booking
        </Button>
      </div>
    </div>
  )
}
