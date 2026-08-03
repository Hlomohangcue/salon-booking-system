import Button from '../components/ui/Button'
import Container from '../components/ui/Container'

const STEPS = [
  {
    number: '01',
    title: 'Choose a Service',
    description: 'Browse our full menu of hair and beauty services and select the one that fits your needs.',
  },
  {
    number: '02',
    title: 'Pick Your Date & Time',
    description: 'Select a date and time that works for you from our available slots.',
  },
  {
    number: '03',
    title: 'Confirm Your Booking',
    description: 'Enter your details and confirm. You will receive a confirmation once your booking is accepted.',
  },
  {
    number: '04',
    title: 'Sit Back & Relax',
    description: 'Arrive at your scheduled time and let our expert team take care of the rest.',
  },
]

export default function BookAppointmentPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 text-white py-20">
        <Container className="text-center">
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-4">
            Your Beauty Journey Starts Here
          </p>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-tight mb-6">
            Book Your Appointment
          </h1>
          <p className="text-purple-100 text-lg max-w-xl mx-auto leading-relaxed">
            Booking online is fast, simple, and available around the clock. Your ideal appointment is just a few steps away.
          </p>
        </Container>
      </section>

      {/* Illustration placeholder */}
      <section className="py-16 bg-white">
        <Container className="flex justify-center">
          <div className="w-full max-w-sm aspect-video rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex flex-col items-center justify-center gap-3 border border-purple-100">
            <svg className="w-16 h-16 text-purple-300" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
            </svg>
            <span className="text-purple-300 text-sm font-medium">Booking Calendar</span>
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Our simple four-step booking process ensures a smooth, stress-free experience.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center"
              >
                <div className="font-display text-4xl font-bold text-purple-100 mb-3 leading-none">
                  {step.number}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Coming Soon */}
      <section className="py-20 bg-white">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50 p-10 text-center opacity-75">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                </svg>
                Coming Soon
              </div>
              <h2 className="font-display text-3xl font-semibold text-gray-700 mb-4">Online Booking</h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Our online booking system is currently being built. In the meantime, please contact us directly to schedule your appointment.
              </p>
              <div className="space-y-3 mb-8">
                {['Select a Service', 'Choose a Date & Time', 'Confirm Details', 'Receive Confirmation'].map((label, i) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg text-sm text-gray-400 cursor-not-allowed">
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    {label}
                  </div>
                ))}
              </div>
              <Button disabled className="opacity-50 cursor-not-allowed" type="button">
                Booking Currently Unavailable
              </Button>
            </div>

            <p className="text-center text-gray-400 text-sm mt-6">
              Want to book now?{' '}
              <a href="/contact" className="text-purple-700 font-medium hover:underline">
                Contact us directly
              </a>{' '}
              and we will arrange your appointment.
            </p>
          </div>
        </Container>
      </section>
    </>
  )
}