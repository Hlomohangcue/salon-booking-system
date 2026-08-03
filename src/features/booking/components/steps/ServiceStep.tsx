import Button from '../../../../components/ui/Button'
import type { Service } from '../../types'

const CATEGORY_COLORS: Record<string, string> = {
  hair: 'bg-purple-100 text-purple-700',
  beard: 'bg-blue-100 text-blue-700',
  makeup: 'bg-pink-100 text-pink-700',
  treatment: 'bg-emerald-100 text-emerald-700',
}

interface ServiceStepProps {
  services: Service[]
  loading: boolean
  error: string | null
  selectedServiceId: string | undefined
  onSelect: (service: Service) => void
  canGoNext: boolean
  onNext: () => void
}

export default function ServiceStep({
  services,
  loading,
  error,
  selectedServiceId,
  onSelect,
  canGoNext,
  onNext,
}: ServiceStepProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" role="status" aria-label="Loading services" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-gray-900 mb-1">Choose a Service</h2>
      <p className="text-gray-500 text-sm mb-6">Select the service you would like to book.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {services.map((service) => {
          const selected = service.serviceId === selectedServiceId
          const colorClass = CATEGORY_COLORS[service.category] ?? 'bg-gray-100 text-gray-700'

          return (
            <button
              key={service.serviceId}
              type="button"
              onClick={() => onSelect(service)}
              aria-pressed={selected}
              className={[
                'w-full text-left rounded-xl border-2 p-4 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600',
                selected
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-gray-50',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${colorClass}`}>
                  {service.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{service.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-purple-700 text-xs font-semibold">From M{service.priceFrom}</span>
                    <span className="text-gray-400 text-xs">{service.durationMinutes} min</span>
                  </div>
                </div>
                {selected && (
                  <div className="shrink-0 ml-auto">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canGoNext}>
          Continue
        </Button>
      </div>
    </div>
  )
}
