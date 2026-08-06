import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import Layout from './components/layout/Layout'
import PageFallback from './components/ui/PageFallback'
import RequireAdmin from './features/auth/components/RequireAdmin'
import AdminLayout from './features/admin/layout/AdminLayout'

// Route-level code splitting — each page is a separate chunk loaded on demand,
// reducing the initial bundle size and improving time-to-interactive.
const HomePage = lazy(() => import('./pages/HomePage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const BookAppointmentPage = lazy(() => import('./pages/BookAppointmentPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(
  () => import('./features/admin/pages/AdminDashboardPage'),
)
const AdminBookingsPage = lazy(
  () => import('./features/admin/pages/AdminBookingsPage'),
)
const AdminServicesPage = lazy(
  () => import('./features/admin/pages/AdminServicesPage'),
)
const AdminCustomersPage = lazy(
  () => import('./features/admin/pages/AdminCustomersPage'),
)
const AdminReportsPage = lazy(
  () => import('./features/admin/pages/AdminReportsPage'),
)
const AdminSettingsPage = lazy(
  () => import('./features/admin/pages/AdminSettingsPage'),
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'services',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ServicesPage />
          </Suspense>
        ),
      },
      {
        path: 'book',
        element: (
          <Suspense fallback={<PageFallback />}>
            <BookAppointmentPage />
          </Suspense>
        ),
      },
      {
        path: 'contact',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ContactPage />
          </Suspense>
        ),
      },
      {
        path: 'admin/login',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminLoginPage />
          </Suspense>
        ),
      },
      {
        path: 'admin',
        element: <RequireAdmin><AdminLayout /></RequireAdmin>,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageFallback />}>
                <AdminDashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'bookings',
            element: (
              <Suspense fallback={<PageFallback />}>
                <AdminBookingsPage />
              </Suspense>
            ),
          },
          {
            path: 'services',
            element: (
              <Suspense fallback={<PageFallback />}>
                <AdminServicesPage />
              </Suspense>
            ),
          },
          {
            path: 'customers',
            element: (
              <Suspense fallback={<PageFallback />}>
                <AdminCustomersPage />
              </Suspense>
            ),
          },
          {
            path: 'reports',
            element: (
              <Suspense fallback={<PageFallback />}>
                <AdminReportsPage />
              </Suspense>
            ),
          },
          {
            path: 'settings',
            element: (
              <Suspense fallback={<PageFallback />}>
                <AdminSettingsPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<PageFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
])
