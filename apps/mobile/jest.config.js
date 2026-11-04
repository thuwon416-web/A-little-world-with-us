module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?
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
: ['ts-jest', { tsconfig: 'tsconfig.json' }],
    '^.+\\.js
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
: 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:@noble/ciphers|@noble/hashes)/)',
  ],
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
