import { useBooking } from '../hooks/useBooking'
import { useServices } from '../hooks/useServices'
import { useAvailability } from '../hooks/useAvailability'
import ProgressIndicator from './ProgressIndicator'
import ServiceStep from './steps/ServiceStep'
import DateStep from './steps/DateStep'
import TimeStep from './steps/TimeStep'
import DetailsStep from './steps/DetailsStep'
import ReviewStep from './steps/ReviewStep'
import SuccessStep from './steps/SuccessStep'

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
  } = useBooking()

  const { services, loading: servicesLoading, error: servicesError } = useServices()

  const { slots, config, configLoading, slotsLoading, error: availError } = useAvailability(
    data.preferredDate ?? null,
    data.serviceDuration ?? 60,
  )

  return (
    <div className="max-w-2xl mx-auto">
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
            onConfirm={goNext}
          />
        )}

        {step === 5 && <SuccessStep onReset={reset} />}
      </div>
    </div>
  )
}
