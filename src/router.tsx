import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import Layout from './components/layout/Layout'
import PageFallback from './components/ui/PageFallback'

// Route-level code splitting — each page is a separate chunk loaded on demand,
// reducing the initial bundle size and improving time-to-interactive.
const HomePage = lazy(() => import('./pages/HomePage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const BookAppointmentPage = lazy(() => import('./pages/BookAppointmentPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

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
