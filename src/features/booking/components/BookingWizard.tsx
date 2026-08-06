import { useRef, useEffect } from 'react'
import { useBooking, type WizardData } from '../hooks/useBooking'
import { useSubmitBooking } from '../hooks/useSubmitBooking'
import { useServices } from '../hooks/useServices'
import { useAvailability } from '../hooks/useAvailability'
import ProgressIndicator from './ProgressIndicator'
import ServiceStep from './steps/ServiceStep'
import DateStep from './steps/DateStep'
import TimeStep from './steps/TimeStep'
import DetailsStep from './steps/DetailsStep'
import ReviewStep from './steps/ReviewStep'
import SuccessStep from './steps/SuccessStep'

const STEP_LABELS = ['Service', 'Date', 'Time', 'Details', 'Review']

export default function BookingWizard() {
  const {
    step,
    data,
    canGoNext,
    goNext,
    goBack,
    selectService,
    selectDate,
    selectTime,
    setDetails,
    reset,
    showSuccess,
  } = useBooking()

  const { services, loading: servicesLoading, error: servicesError } = useServices()

  const { slots, config, configLoading, slotsLoading, error: availError } = useAvailability(
    data.preferredDate ?? null,
    data.serviceDuration ?? 60,
  )

  // Build a complete WizardData for submission. All fields are populated by the
  // time the user reaches the Review step (step 4), so these fallbacks are just
  // defensive defaults for TypeScript and are never actually submitted as-is.
  const wizardData: WizardData = {
    serviceId: data.serviceId ?? '',
    serviceName: data.serviceName ?? '',
    serviceDuration: data.serviceDuration ?? 0,
    priceFrom: data.priceFrom ?? 0,
    preferredDate: data.preferredDate ?? '',
    preferredTime: data.preferredTime ?? '',
    customerName: data.customerName ?? '',
    phoneNumber: data.phoneNumber ?? '',
    email: data.email ?? '',
    notes: data.notes ?? '',
  }

  const { submit, submitting, error: submitError, bookingId } = useSubmitBooking(wizardData)

  const handleConfirm = async () => {
    try {
      await submit()
      // Only advance to the success screen after a successful write.
      showSuccess()
    } catch {
      // The error is already surfaced via submitError — stay on the Review step.
    }
  }

  // Move focus to the live region announcement on every step change
  const liveRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    liveRef.current?.focus()
  }, [step])

  return (
    <div className="max-w-2xl mx-auto">
      {/* Screen-reader live region: announces step changes without visual impact */}
      <div
        ref={liveRef}
        tabIndex={-1}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {step < 5
          ? `Step ${step + 1} of 5: ${STEP_LABELS[step] ?? ''}`
          : 'Booking details submitted'}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {step < 5 && <ProgressIndicator currentStep={step} />}

        {step === 0 && (
          <ServiceStep
            services={services}
            loading={servicesLoading}
            error={servicesError}
            selectedServiceId={data.serviceId}
            onSelect={selectService}
            canGoNext={canGoNext}
            onNext={goNext}
          />
        )}

        {step === 1 && (
          <DateStep
            config={config}
            configLoading={configLoading}
            error={availError}
            selectedDate={data.preferredDate}
            onSelect={selectDate}
            canGoNext={canGoNext}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {step === 2 && (
          <TimeStep
            slots={slots}
            loading={slotsLoading}
            error={availError}
            selectedDate={data.preferredDate}
            selectedTime={data.preferredTime}
            onSelect={selectTime}
            canGoNext={canGoNext}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {step === 3 && (
          <DetailsStep
            initialValues={{
              customerName: data.customerName ?? '',
              phoneNumber: data.phoneNumber ?? '',
              email: data.email ?? '',
              notes: data.notes ?? '',
            }}
            onSubmit={(details) => {
              setDetails(details)
              goNext()
            }}
            onBack={goBack}
          />
        )}

        {step === 4 && (
          <ReviewStep
            data={data}
            services={services}
            onBack={goBack}
            onConfirm={handleConfirm}
            submitting={submitting}
            submitError={submitError}
          />
        )}

        {step === 5 && <SuccessStep onReset={reset} bookingId={bookingId} />}
      </div>
    </div>
  )
}
