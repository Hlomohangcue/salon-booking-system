import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Container from '../../components/ui/Container'
import Button from '../../components/ui/Button'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { setSessionPersistence, sendPasswordReset } from '../../features/auth/services/authService'
import type { LoginFormValues } from '../../features/auth/types'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition'

const INPUT_ERROR_CLASS =
  'w-full rounded-lg border border-red-400 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition'

export default function AdminLoginPage() {
  const { signIn, isAdmin, initializing } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [remember, setRemember] = useState(true)
  const [resetSent, setResetSent] = useState(false)
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // If already signed in and an admin, skip the login form.
  if (!initializing && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    setResetSent(false)
    try {
      // Apply the chosen persistence level BEFORE signing in.
      await setSessionPersistence(remember)
      await signIn(values.email, values.password)
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      navigate(from ?? '/admin', { replace: true })
    } catch {
      setError('Invalid email or password. Please try again.')
    }
  })

  const handleForgotPassword = async () => {
    const email = getValues('email')
    setResetSent(false)
    setError(null)
    if (!email || !z.string().email().safeParse(email).success) {
      setError('Enter a valid email address to reset your password.')
      return
    }
    setResetSubmitting(true)
    try {
      await sendPasswordReset(email)
      setResetSent(true)
    } catch {
      setError('We could not send a reset email. Check the address and try again.')
    } finally {
      setResetSubmitting(false)
    }
  }

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 text-white py-16">
        <Container className="text-center">
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-4">
            Admin Access
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight mb-4">
            Salon Admin Login
          </h1>
          <p className="text-purple-100 text-lg max-w-xl mx-auto leading-relaxed">
            Sign in to manage bookings, services, and settings.
          </p>
        </Container>
      </section>

      {/* Login form */}
      <section className="py-16 bg-gray-50 min-h-screen">
        <Container className="max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">
              Sign In
            </h2>

            {error && (
              <div
                className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6"
                role="alert"
              >
                {error}
              </div>
            )}

            {resetSent && (
              <div
                className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 mb-6"
                role="status"
              >
                If an account exists for that email, a password reset link has
                been sent. Please check your inbox.
              </div>
            )}

            <form onSubmit={onSubmit} noValidate aria-label="Admin login form">
              <div className="space-y-5 mb-8">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@makeng-salon.co.za"
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={errors.email ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1.5 text-xs text-red-600" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <input
                    {...register('password')}
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={errors.password ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  />
                  {errors.password && (
                    <p id="password-error" className="mt-1.5 text-xs text-red-600" role="alert">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-700 focus:ring-purple-500"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetSubmitting}
                    className="text-sm font-medium text-purple-700 hover:text-purple-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50"
                  >
                    {resetSubmitting ? 'Sending...' : 'Forgot password?'}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full justify-center">
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>
        </Container>
      </section>
    </>
  )
}
