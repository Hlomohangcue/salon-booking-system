import PageHeader from '../components/ui/PageHeader'
import DashboardCard from '../components/ui/DashboardCard'
import EmptyState from '../components/ui/EmptyState'
import { usePageTitle } from '../../../hooks/usePageTitle'

/**
 * Placeholder Customers page.
 * Customer directory and history land in a later phase.
 */
export default function AdminCustomersPage() {
  usePageTitle('Customers')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Management"
        title="Customers"
        description="View your customer directory and appointment history."
      />

      <DashboardCard title="Customer Directory" description="Coming soon">
        <EmptyState
          title="No customers yet"
          description="Customer management will be available in an upcoming phase."
        />
      </DashboardCard>
    </div>
  )
}
