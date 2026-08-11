import { RouterProvider } from 'react-router'
import { router } from './router'
import { AuthProvider } from './features/auth/AuthContext'
import ErrorBoundary from './components/ui/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  )
}
