import { Fragment } from 'react'

const STEP_LABELS = ['Service', 'Date', 'Time', 'Details', 'Review']

interface ProgressIndicatorProps {
  currentStep: number
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="flex items-center p-0 m-0 list-none">
        {STEP_LABELS.map((label, i) => {
          const completed = i < currentStep
          const active = i === currentStep

          return (
            <Fragment key={i}>
              <li className="flex flex-col items-center shrink-0">
                {/* Screen-reader-only step status announcement */}
                <span className="sr-only">
                  {completed ? `Completed: ${label}` : active ? `Current step: ${label}` : `Upcoming: ${label}`}
                </span>

                {/* Visual step bubble */}
                <div
                  aria-hidden="true"
                  className={[
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                    completed || active ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-400',
                  ].join(' ')}
                >
                  {completed ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>

                {/* Visible label — hidden on mobile to save space */}
                <span
                  aria-hidden="true"
                  className={[
                    'mt-1.5 text-xs font-medium hidden sm:block',
                    active ? 'text-purple-700' : completed ? 'text-purple-500' : 'text-gray-400',
                  ].join(' ')}
                >
                  {label}
                </span>
              </li>

              {/* Connector line between steps */}
              {i < STEP_LABELS.length - 1 && (
                <li
                  aria-hidden="true"
                  className={`flex-1 h-0.5 mx-1 mb-4 sm:mb-0 transition-colors ${i < currentStep ? 'bg-purple-600' : 'bg-gray-200'}`}
                />
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
