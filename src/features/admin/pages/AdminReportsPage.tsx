import PageHeader from '../components/ui/PageHeader'
import DashboardCard from '../components/ui/DashboardCard'
import EmptyState from '../components/ui/EmptyState'
import { usePageTitle } from '../../../hooks/usePageTitle'

/**
 * Placeholder Reports page.
 * Revenue and booking analytics land in a later phase.
 */
export default function AdminReportsPage() {
  usePageTitle('Reports')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Track revenue, booking trends, and salon performance."
      />

      <DashboardCard title="Analytics" description="Coming soon">
        <EmptyState
          title="No reports yet"
          description="Analytics and reporting will be available in an upcoming phase."
        />
      </DashboardCard>
    </div>
  )
}
