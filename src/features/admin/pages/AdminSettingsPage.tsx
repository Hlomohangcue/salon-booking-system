import PageHeader from '../components/ui/PageHeader'
import DashboardCard from '../components/ui/DashboardCard'
import EmptyState from '../components/ui/EmptyState'
import { usePageTitle } from '../../../hooks/usePageTitle'

// Placeholder Settings page. Configure opening hours, holidays, and booking rules in a later phase.
export default function AdminSettingsPage() {
  usePageTitle('Settings')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Configure opening hours, holidays, and booking rules."
      />

      <DashboardCard title="Booking Settings" description="Coming soon">
        <EmptyState
          title="No settings yet"
          description="Settings configuration will be available in an upcoming phase."
        />
      </DashboardCard>
    </div>
  )
}
