import { useState } from 'react'
import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAuth } from '../../auth/hooks/useAuth'

/**
 * Admin application shell.
 *
 * Provides the authenticated admin with a responsive layout:
 * - Desktop: a fixed left sidebar, a top bar, and a content area.
 * - Mobile: a collapsible sidebar drawer triggered from the top bar.
 *
 * Nested admin routes render into the Outlet.
 */
export default function AdminLayout() {
  const { adminUser } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        role={adminUser?.role}
        open={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
