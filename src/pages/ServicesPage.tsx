import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'
import Card from '../components/ui/Card'

interface Service {
  emoji: string
  name: string
  description: string
  price: string
}

const SERVICES: Service[] = [
  {
    emoji: '✂️',
    name: 'Haircut',
    description: 'Precision cuts shaped to your face structure and lifestyle. Includes wash and blow-dry.',
    price: 'From R–',
  },
  {
    emoji: '💁',
    name: 'Hair Styling',
    description: 'Professional blow-outs, curls, and occasion styles that last. Perfect for any event.',
    price: 'From R–',
  },
  {
    emoji: '🎨',
    name: 'Hair Colouring',
    description: 'Full colour, highlights, balayage, or ombré. Vibrant results with colour-safe products.',
    price: 'From R–',
  },
  {
    emoji: '🧶',
    name: 'Braiding',
    description: 'Box braids, cornrows, knotless braids, and more. Durable, neat, and beautifully finished.',
    price: 'From R–',
  },
  {
    emoji: '💆',
    name: 'Hair Treatment',
    description: 'Deep conditioning and repair treatments to restore moisture, strength, and shine.',
    price: 'From R–',
  },
  {
    emoji: '🧔',
    name: 'Beard Grooming',
    description: 'Shape, trim, and condition your beard to perfection. Includes hot towel and beard oil.',
    price: 'From R–',
  },
  {
    emoji: '💄',
    name: 'Makeup',
    description: 'Full glam or natural everyday looks for any occasion, applied by experienced makeup artists.',
    price: 'From R–',
  },
]

export default function ServicesPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-purple-950 to-purple-800 text-white py-16">
        <Container>
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-3">What We Offer</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight mb-4">Our Services</h1>
          <p className="text-purple-100 text-lg max-w-xl">
            A complete menu of professional hair and beauty services tailored to make you look and feel your best.
          </p>
        </Container>
      </section>

      {/* Services grid */}
      <section className="py-20 bg-white">
        <Container>
          <SectionTitle
            title="All Services"
            subtitle="Every service is delivered with care, skill, and premium products."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <Card key={service.name} hover className="flex flex-col">
                <div
                  className="text-4xl mb-4 w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center"
                  role="img"
                  aria-label={service.name}
                >
                  {service.emoji}
                </div>
                <h2 className="font-display text-xl font-semibold text-gray-900 mb-2">{service.name}</h2>
                <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{service.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <span className="text-purple-700 font-semibold text-sm">{service.price}</span>
                  <Button to="/book" size="sm" variant="outline">
                    Book
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 bg-purple-50">
        <Container className="text-center">
          <h2 className="font-display text-3xl font-semibold text-gray-900 mb-4">Not Sure What You Need?</h2>
          <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
            Get in touch and our team will help you choose the right service for your hair type and goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button to="/book" size="lg">Book an Appointment</Button>
            <Button to="/contact" variant="outline" size="lg">Contact Us</Button>
          </div>
        </Container>
      </section>
    </>
  )
}