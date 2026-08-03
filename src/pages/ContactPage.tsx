import Button from '../components/ui/Button'
import Container from '../components/ui/Container'

const HOURS = [
  { day: 'Monday – Friday', time: '8:00 AM – 7:00 PM' },
  { day: 'Saturday', time: '9:00 AM – 6:00 PM' },
  { day: 'Sunday', time: '10:00 AM – 4:00 PM' },
]

export default function ContactPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-purple-950 to-purple-800 text-white py-16">
        <Container>
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-3">Get in Touch</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight mb-4">Contact Us</h1>
          <p className="text-purple-100 text-lg max-w-xl">
            We would love to hear from you. Reach out to us for bookings, enquiries, or just to say hello.
          </p>
        </Container>
      </section>

      <section className="py-20 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Info */}
            <div className="space-y-10">
              {/* About */}
              <div>
                <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">About Makeng Salon</h2>
                <p className="text-gray-500 leading-relaxed mb-3">
                  Makeng Salon is a premier hair and beauty destination dedicated to making every client look and feel
                  their absolute best. Our experienced team combines artistic skill with the finest products to deliver
                  transformations that go beyond expectations.
                </p>
                <p className="text-gray-500 leading-relaxed">
                  Whether you are looking for a quick trim or a complete style overhaul, we welcome you with a warm,
                  professional atmosphere where your comfort and satisfaction always come first.
                </p>
              </div>

              {/* Hours */}
              <div>
                <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">Business Hours</h2>
                <ul className="space-y-2">
                  {HOURS.map(({ day, time }) => (
                    <li key={day} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">{day}</span>
                      <span className="text-gray-900 font-medium text-sm">{time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact details */}
              <div>
                <h2 className="font-display text-2xl font-semibold text-gray-900 mb-4">Contact Details</h2>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Phone</p>
                      <a href="tel:+27000000000" className="text-gray-800 hover:text-purple-700 transition-colors font-medium">
                        +27 XX XXX XXXX
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Email</p>
                      <a href="mailto:hello@makeng-salon.co.za" className="text-gray-800 hover:text-purple-700 transition-colors font-medium">
                        hello@makeng-salon.co.za
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Address</p>
                      <p className="text-gray-800 font-medium">123 Salon Street, City, Province</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: Contact form */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">Send Us a Message</h2>
              <form
                onSubmit={(e) => e.preventDefault()}
                noValidate
                aria-label="Contact form"
                className="space-y-5"
              >
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    autoComplete="name"
                    required
                    placeholder="Jane Doe"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder="jane@example.com"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-gray-400 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    autoComplete="tel"
                    placeholder="+27 XX XXX XXXX"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    placeholder="Tell us how we can help you..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                  />
                </div>

                <Button type="submit" className="w-full justify-center">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}