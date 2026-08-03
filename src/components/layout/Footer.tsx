import { Link, NavLink } from 'react-router'
import Container from '../ui/Container'

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/book', label: 'Book Appointment' },
  { to: '/contact', label: 'Contact' },
]

const SOCIALS = [
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.524 5.849L0 24l6.336-1.502A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.792 9.792 0 0 1-5.013-1.378l-.36-.213-3.724.883.924-3.626-.234-.373A9.77 9.77 0 0 1 2.182 12c0-5.418 4.4-9.818 9.818-9.818S21.818 6.582 21.818 12 17.418 21.818 12 21.818z" />
      </svg>
    ),
  },
  {
    label: 'X (Twitter)',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <Container className="py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <Link to="/" className="font-display text-xl font-semibold text-white mb-3 inline-block">
              Makeng Salon
            </Link>
            <p className="text-sm leading-relaxed mb-5">
              Premium hair and beauty services crafted to bring out your best self. Your transformation begins here.
            </p>
            <div className="flex gap-4">
              {SOCIALS.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-gray-500 hover:text-purple-400 transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `text-sm transition-colors ${isActive ? 'text-purple-400' : 'hover:text-white'}`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-500 mr-1">Phone:</span>
                <a href="tel:+27000000000" className="hover:text-white transition-colors">+27 XX XXX XXXX</a>
              </li>
              <li>
                <span className="text-gray-500 mr-1">Email:</span>
                <a href="mailto:hello@makeng-salon.co.za" className="hover:text-white transition-colors">
                  hello@makeng-salon.co.za
                </a>
              </li>
              <li>
                <span className="text-gray-500 mr-1">Address:</span>
                123 Salon Street, City
              </li>
              <li className="pt-1">
                <span className="text-gray-500 block mb-1">Hours:</span>
                <span className="block">Mon–Fri: 8:00 AM – 7:00 PM</span>
                <span className="block">Sat: 9:00 AM – 6:00 PM</span>
                <span className="block">Sun: 10:00 AM – 4:00 PM</span>
              </li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <Container className="py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} Makeng Salon. All rights reserved.</p>
          <p>
            Powered by{' '}
            <a
              href="#"
              className="text-gray-500 hover:text-purple-400 transition-colors"
              aria-label="Slimes.Hustlers AI Solutions"
            >
              Slimes.Hustlers AI Solutions
            </a>
          </p>
        </Container>
      </div>
    </footer>
  )
}
