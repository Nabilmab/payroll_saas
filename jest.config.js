// ./jest.config.js (in the project root)
module.exports = {
  testEnvironment: 'node',
  verbose: true, // Shows individual test results
  rootDir: './backend', // <<< Important: Tells Jest to look for tests and code within the 'backend' directory
  setupFilesAfterEnv: ['./jest.setup.js'], // If you create jest.setup.js inside ./backend
  // testMatch: ['**/__tests__/**/*.test.js'], // Default pattern, usually fine
  // globalTeardown: './jest.global-teardown.js' // If you need a global teardown for DB connection
};
