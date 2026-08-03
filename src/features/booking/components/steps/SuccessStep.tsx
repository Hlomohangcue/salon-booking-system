import Button from '../../../../components/ui/Button'

interface SuccessStepProps {
  onReset: () => void
}

export default function SuccessStep({ onReset }: SuccessStepProps) {
  return (
    <div className="text-center py-8">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      </div>

      <h2 className="font-display text-2xl font-semibold text-gray-900 mb-3">
        You&rsquo;re Almost There!
      </h2>

      <p className="text-gray-500 text-sm max-w-sm mx-auto mb-2">
        Your booking details have been captured successfully.
      </p>

      {/* Phase 3.3 notice */}
      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-4 py-2 rounded-full mt-2 mb-8">
        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
        </svg>
        Firestore submission will be completed in Phase 3.3
      </div>

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
