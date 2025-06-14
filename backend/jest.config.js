// --- START OF NEW FILE ---
// ---
// backend/jest.config.js
// ---
module.exports = {
  // A list of paths to modules that run some code to configure or
  // set up the testing environment before each test file in the suite is executed.
  setupFiles: ['dotenv/config'],
  
  // The test environment that will be used for testing
  testEnvironment: 'node',

  // A path to a module which exports an async function that is triggered once after all test suites
  setupFilesAfterEnv: ['./jest.setup.js'],
};