import { useState } from 'react'
import { NavLink } from 'react-router'
import Button from '../ui/Button'
import Container from '../ui/Container'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services', end: false },
  { to: '/contact', label: 'Contact', end: false },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <Container>
        <nav className="h-16 flex items-center justify-between">
          <NavLink
            to="/"
            className="font-display text-xl font-semibold text-purple-800 tracking-tight shrink-0"
          >
            Makeng Salon
          </NavLink>

          {/* Desktop navigation */}
          <ul className="hidden md:flex items-center gap-7 flex-1 justify-center">
            {NAV_LINKS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors ${
                      isActive ? 'text-purple-700' : 'text-gray-600 hover:text-purple-700'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="hidden md:block shrink-0">
            <Button to="/book" size="sm">
              Book Appointment
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-purple-700 hover:bg-gray-50 transition-colors"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>
      </Container>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="mobile-nav" className="md:hidden border-t border-gray-100 bg-white">
          <Container>
            <ul className="py-3 space-y-1">
              {NAV_LINKS.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-purple-700'
                      }`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
              <li className="pt-2">
                <Button to="/book" size="sm" className="w-full justify-center" onClick={() => setMenuOpen(false)}>
                  Book Appointment
                </Button>
              </li>
            </ul>
          </Container>
        </div>
      )}
    </header>
  )
}
