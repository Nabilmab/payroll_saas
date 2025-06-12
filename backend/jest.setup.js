// C:\payroll_saas\backend\jest.setup.js

// By the time this file runs, jest.env.js has already loaded the .env variables.
const { sequelize } = require('./models');

// A simple, powerful check to ensure the environment is configured.
// If this fails, the test run will stop immediately with a clear error.
if (!process.env.DATABASE_URL) {
  throw new Error("FATAL: DATABASE_URL not loaded. Check jest.config.js and backend/jest.env.js.");
}

// This hook will run after all tests in a file have completed.
afterAll(async () => {
  // Gracefully close the database connection.
  if (sequelize && typeof sequelize.close === 'function') {
    await sequelize.close();
  }
});