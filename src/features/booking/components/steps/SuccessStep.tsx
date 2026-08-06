import Button from '../../../../components/ui/Button'

interface SuccessStepProps {
  onReset: () => void
  /** The Firestore document ID returned by createBooking(), used as the booking reference. */
  bookingId: string | null
}

export default function SuccessStep({ onReset, bookingId }: SuccessStepProps) {
  return (
    <div className="text-center py-8">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      </div>

      <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">
        Booking Confirmed
      </h2>

      <p className="text-gray-500 text-sm max-w-sm mx-auto mb-2">
        Your appointment has been booked successfully.
      </p>

      {/* Booking reference */}
      {bookingId && (
        <div className="inline-flex flex-col items-center gap-1 bg-purple-50 border border-purple-200 text-purple-800 px-6 py-4 rounded-xl mt-2 mb-8">
          <span className="text-xs font-semibold uppercase tracking-wide text-purple-500">
            Booking Reference
          </span>
          <span className="font-mono text-lg font-semibold break-all">{bookingId}</span>
        </div>
      )}

      <p className="text-gray-500 text-xs max-w-sm mx-auto mb-8">
        Please keep this booking reference. It may be required if you need to
        reschedule or cancel your appointment.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button to="/contact" variant="outline">
          Contact Us Directly
        </Button>
        <Button onClick={onReset}>
          Book Another Appointment
        </Button>
      </div>
    </div>
  )
}
