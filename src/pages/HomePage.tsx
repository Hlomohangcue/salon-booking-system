import { Link } from 'react-router'

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">Welcome to Makeng Salon</h1>
      <p className="text-xl text-gray-500 mb-10">Experience premium hair and beauty services tailored for you.</p>
      <Link
        to="/book"
        className="inline-block bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-800 transition-colors"
      >
        Book an Appointment
      </Link>
    </div>
  )
}
