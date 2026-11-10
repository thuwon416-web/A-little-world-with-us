import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    globals: false,
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}',
        'src/features/**/*.{ts,tsx}',
        'src/app/api/**/*.{ts,tsx}',
        '../backend/supabase/functions/_shared/emailNotifier.ts',
        '../backend/supabase/functions/check-missed-checkin/email-notification-state.ts',
        '../backend/src/lib/drive-orphan-transfer.ts',
        '../../../scripts/deploy-readiness-utils.ts',
      ],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/types.ts',
      ],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        global: {
          lines: 15,
          branches: 10,
        },
      },
    },
  },
})
