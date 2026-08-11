import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/__tests__/*.test.{ts,tsx}',
    ],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/features/booking/utils/slotGenerator.ts',
        'src/features/booking/utils/bookingStateMachine.ts',
        'src/features/booking/utils/dateHelpers.ts',
        'src/features/booking/utils/bookingValidation.ts',
        'src/features/booking/services/bookingConverter.ts',
        'src/features/booking/errors/bookingErrors.ts',
        'src/features/admin/reports/services/adminReportsService.ts',
        'src/features/admin/services/serviceValidation.ts',
        'src/features/admin/settings/settingsValidation.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 75,
      },
    },
  },
})
