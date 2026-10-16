module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/tests', '<rootDir>/services', '<rootDir>/utils'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  modulePathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/scratch'],
  collectCoverageFrom: [
    'services/intelligence/engines/**/*.js',
    'services/careerIntelligenceService.js',
    'services/resume/resumeAnalysisService.js',
    'utils/gpaUtils.js',
    'services/parser/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  testTimeout: 20000,
  verbose: true
}
