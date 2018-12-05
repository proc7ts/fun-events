module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts}',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'target/coverage',
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        'suiteName': 'fun-events',
        'outputDirectory': './target/test-results',
        'classNameTemplate': '{classname}: {title}',
        'titleTemplate': '{classname}: {title}',
        'ancestorSeparator': ' › ',
        'usePathForSuiteName': 'true',
      },
    ],
  ],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.spec.json',
    },
  },
};
