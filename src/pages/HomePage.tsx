import { Link } from 'react-router'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'
import Card from '../components/ui/Card'

const FEATURED_SERVICES = [
  {
    emoji: '✂️',
    name: 'Precision Haircut',
    description: 'Tailored cuts that complement your face shape and personal style.',
  },
  {
    emoji: '🎨',
    name: 'Hair Colouring',
    description: 'Vibrant colours, subtle highlights, or natural-looking balayage — we do it all.',
  },
  {
    emoji: '🧶',
    name: 'Braiding',
    description: 'Expert braiding services for every occasion, from box braids to intricate styles.',
  },
]

const WHY_US = [
  {
    title: 'Expert Stylists',
    description: 'Our team brings years of experience and ongoing training to every appointment.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    title: 'Premium Products',
    description: 'We use only the finest professional-grade products to protect and enhance your hair.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  },
  {
    title: 'Easy Booking',
    description: 'Schedule your appointment online in minutes, at a time that suits you.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Your Satisfaction',
    description: 'We are committed to delivering results that exceed your expectations, every time.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
  },
]

const TESTIMONIALS = [
  {
    name: 'Amara N.',
    role: 'Regular Client',
    quote: 'Absolutely loved my experience at Makeng Salon. The stylists are incredibly skilled and attentive to what you want.',
  },
  {
    name: 'Kefilwe M.',
    role: 'Loyal Client',
    quote: 'My go-to salon for braiding. I always leave feeling beautiful and confident. Highly recommend to everyone!',
  },
  {
    name: 'Zanele D.',
    role: 'Valued Client',
    quote: 'Professional service from start to finish. The atmosphere is warm and welcoming, and the results are stunning.',
  },
]

const GALLERY_ITEMS = [
  { bg: 'bg-purple-100' },
  { bg: 'bg-amber-50' },
  { bg: 'bg-purple-50' },
  { bg: 'bg-gray-100' },
  { bg: 'bg-rose-50' },
  { bg: 'bg-indigo-50' },
]

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 text-white py-24 md:py-36 overflow-hidden relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-32 -left-16 w-64 h-64 rounded-full bg-white" />
        </div>
        <Container className="relative">
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-4">
            Welcome to Makeng Salon
          </p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold leading-tight mb-6 max-w-2xl">
            Where Beauty Meets Elegance
          </h1>
          <p className="text-purple-100 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl">
            Expert hair and beauty services crafted to bring out your best self. Book your transformation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button to="/book" size="lg">
              Book an Appointment
            </Button>
            <Button to="/services" variant="white" size="lg">
              Explore Services
            </Button>
          </div>
        </Container>
      </section>

      {/* ── Services Preview ─────────────────────────────────── */}
      <section className="py-20 bg-white">
        <Container>
          <SectionTitle
            title="Our Services"
            subtitle="From precision cuts to vibrant colours — we offer a full range of professional salon services."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {FEATURED_SERVICES.map((service) => (
              <Card key={service.name} hover className="text-center">
                <div className="text-4xl mb-4" role="img" aria-label={service.name}>
                  {service.emoji}
                </div>
                <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{service.description}</p>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/services"
              className="text-purple-700 font-semibold text-sm hover:text-purple-900 transition-colors underline underline-offset-4"
            >
              View all services →
            </Link>
          </div>
        </Container>
      </section>

      {/* ── Why Choose Us ────────────────────────────────────── */}
      <section className="py-20 bg-purple-50">
        <Container>
          <SectionTitle
            title="Why Choose Makeng Salon"
            subtitle="We are dedicated to delivering an exceptional experience from the moment you walk through our doors."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((item) => (
              <div key={item.title} className="text-center px-4">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4 text-purple-700">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <Container>
          <SectionTitle
            title="What Our Clients Say"
            subtitle="Real experiences from the people who trust us with their beauty."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="flex flex-col gap-4">
                <div className="flex gap-1" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Gallery Preview ───────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <Container>
          <SectionTitle
            title="Our Work"
            subtitle="A glimpse of the transformations we create every day."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {GALLERY_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`${item.bg} rounded-xl aspect-square flex items-center justify-center`}
                aria-label={`Gallery item ${i + 1}`}
              >
                <span className="text-gray-400 text-xs font-medium tracking-wide">Coming Soon</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Contact CTA ──────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 text-white">
        <Container className="text-center">
          <SectionTitle
            title="Ready for a New Look?"
            subtitle="Book your appointment today and let our experts take care of the rest."
            light
          />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button to="/book" size="lg">
              Book Now
            </Button>
            <Button to="/contact" variant="white" size="lg">
              Get in Touch
            </Button>
          </div>
        </Container>
      </section>
    </>
  )
}
