import PageHeader from '../components/ui/PageHeader'
import DashboardCard from '../components/ui/DashboardCard'
import EmptyState from '../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import { usePageTitle } from '../../../hooks/usePageTitle'

/**
 * Placeholder Services management page.
 * Full service CRUD lands in a later phase.
 */
export default function AdminServicesPage() {
  usePageTitle('Services')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Management"
        title="Services"
        description="Add, edit, or deactivate salon services."
        actions={
          <Button to="/admin/services" size="sm">
            Add Service
          </Button>
        }
      />

      <DashboardCard title="All Services" description="Coming soon">
        <EmptyState
          title="No services yet"
          description="Service management will be available in an upcoming phase."
        />
      </DashboardCard>
    </div>
  )
}
