import Button from '../components/ui/Button'
import Container from '../components/ui/Container'

export default function NotFoundPage() {
  return (
    <section className="py-32">
      <Container className="text-center">
        <p className="font-display text-8xl font-bold text-purple-100 mb-2">404</p>
        <h1 className="font-display text-3xl font-semibold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
          Sorry, we could not find the page you are looking for.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button to="/">Back to Home</Button>
          <Button to="/contact" variant="outline">Contact Us</Button>
        </div>
      </Container>
    </section>
  )
}
