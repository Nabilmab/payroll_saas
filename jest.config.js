// C:\payroll_saas\jest.config.js

/** @type {import('jest').Config} */
const config = {
  // The test environment that will be used for testing. 'node' is required for a backend project.
  testEnvironment: 'node',

  // Explicitly tell Jest that the 'backend' folder is the root for all our source code and tests.
  // This helps with module resolution and keeps tests properly isolated.
  roots: ['<rootDir>/backend'],

  // The glob patterns Jest uses to detect test files.
  // This will find any .js file inside a __tests__ directory within the backend folder.
  testMatch: ['**/__tests__/**/*.js'],

  // A list of paths to modules that run some code to configure or
  // set up the testing environment before each test.
  setupFilesAfterEnv: ['<rootDir>/backend/jest.setup.js'],

  // An empty transform object `{}` is crucial for ESM support. It tells Jest
  // not to use its default transformer (Babel) and to instead respect
  // the Node.js environment, which we've configured with '--experimental-vm-modules' in the test script.
  transform: {},
};

export default config;