import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    globals: false,
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/app/api/**',
        'src/**/types.ts',
      ],
      reporter: ['text', 'html', 'lcov'],
      // TODO: Raise thresholds in Sprint 4 after test coverage work
      // (See fix-phase plan: Sprint 2 covers testing)
      thresholds: {
        global: {
          lines: 5,
          branches: 3,
        },
        // TODO Sprint 4: raise to 60/50 and lib/ to 80
      },
    },
  },
})
