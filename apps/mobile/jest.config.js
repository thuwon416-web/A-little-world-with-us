module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  coveragePathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  // TODO: Raise thresholds in Sprint 4 after test coverage work
  // (See fix-phase plan: Sprint 2 covers testing)
  coverageThreshold: {
    global: {
      lines: 5,
    },
    // TODO Sprint 4: raise to 30
  },
}
