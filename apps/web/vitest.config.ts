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
      // API routes remain excluded until route-level coverage is added.
      // TODO: Remove src/app/api/** from exclusions after API test coverage is established.
      thresholds: {
        global: {
          lines: 15,
          branches: 10,
        },
      },
    },
  },
})
