import Container from '../components/ui/Container'
import BookingWizard from '../features/booking/components/BookingWizard'

export default function BookAppointmentPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 text-white py-16">
        <Container className="text-center">
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-4">
            Your Beauty Journey Starts Here
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight mb-4">
            Book Your Appointment
          </h1>
          <p className="text-purple-100 text-lg max-w-xl mx-auto leading-relaxed">
            Simple, fast, and available around the clock. Your ideal appointment is just a few steps away.
          </p>
        </Container>
      </section>

      {/* Booking wizard */}
      <section className="py-12 bg-gray-50 min-h-screen">
        <Container>
          <BookingWizard />
        </Container>
      </section>
    </>
  )
}