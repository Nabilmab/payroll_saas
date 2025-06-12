// C:\payroll_saas\backend\jest.setup.js

// We don't need to load dotenv here anymore. config/config.js does it.
const { sequelize } = require('./models');

// This hook runs after all tests in a suite have completed.
afterAll(async () => {
  if (sequelize && typeof sequelize.close === 'function') {
    await sequelize.close();
  }
});