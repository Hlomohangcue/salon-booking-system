import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-7xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-500 mb-8">Sorry, the page you are looking for does not exist.</p>
      <Link
        to="/"
        className="inline-block bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-800 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  )
}
