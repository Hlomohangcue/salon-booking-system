export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm font-semibold text-white">Makeng Salon</p>
        <p className="text-sm">&copy; {new Date().getFullYear()} Makeng Salon. All rights reserved.</p>
      </div>
    </footer>
  )
}
