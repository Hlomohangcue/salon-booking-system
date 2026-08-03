import { createBrowserRouter } from 'react-router'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import ServicesPage from './pages/ServicesPage'
import BookAppointmentPage from './pages/BookAppointmentPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'book', element: <BookAppointmentPage /> },
      { path: 'contact', element: <ContactPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
