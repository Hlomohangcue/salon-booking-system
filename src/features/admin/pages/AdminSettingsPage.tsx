import PageHeader from '../components/ui/PageHeader'
import DashboardCard from '../components/ui/DashboardCard'
import LoadingState from '../components/ui/LoadingState'
import NotificationSettingsForm from '../settings/components/NotificationSettingsForm'
import { useAdminSettings } from '../settings/useAdminSettings'
import { usePageTitle } from '../../../hooks/usePageTitle'

/**
 * Admin settings page — notification toggles wired to settings/notifications.
 */
export default function AdminSettingsPage() {
  usePageTitle('Settings')

  const {
    settings,
    loading,
    error,
    saving,
    savingSection,
    successMessage,
    saveError,
    saveNotifications,
  } = useAdminSettings()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Configure salon notification preferences."
      />

      {loading && <LoadingState label="Loading settings" />}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <DashboardCard
          title="Notifications"
          description="Control which confirmation channels are active when a booking is confirmed."
        >
          {successMessage && savingSection === null && (
            <p className="text-sm text-emerald-600 mb-4" role="status">
              {successMessage}
            </p>
          )}
          {saveError && (
            <p className="text-sm text-red-600 mb-4" role="alert">
              {saveError}
            </p>
          )}
          <NotificationSettingsForm
            defaultValues={settings.notifications}
            submitting={saving && savingSection === 'notifications'}
            onSubmit={async (data) => {
              await saveNotifications({
                emailEnabled: data.emailEnabled,
                whatsappEnabled: data.whatsappEnabled,
                smsPlaceholder: data.smsPlaceholder ?? '',
                whatsappPlaceholder: data.whatsappPlaceholder ?? '',
              })
            }}
          />
        </DashboardCard>
      )}
    </div>
  )
}
