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
  // Keep a conservative executable baseline until the mobile suite has enough
  // coverage to raise thresholds without turning the release gate into a guess.
  coverageThreshold: {
    global: {
      lines: 5,
    },
  },
}
