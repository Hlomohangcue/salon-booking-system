/**
 * Minimal loading fallback shown while a lazily-loaded route chunk is fetched.
 * Rendered inside a Suspense boundary for each route-level lazy import.
 */
export default function PageFallback() {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" />
    </div>
  )
}
