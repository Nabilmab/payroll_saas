// C:\payroll_saas\jest.config.js
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  rootDir: './backend',
  // Use setupFiles to load env vars BEFORE the test framework is installed
  setupFiles: ['./jest.env.js'],
  // Use setupFilesAfterEnv for things that need the test framework, like afterAll
  setupFilesAfterEnv: ['./jest.setup.js'],
};