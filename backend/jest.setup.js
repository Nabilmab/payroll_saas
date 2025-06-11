// backend/jest.setup.js
require('dotenv').config({ path: './.env' }); // Load .env file from the backend directory

const { sequelize } = require('./models'); // Path relative to backend/

afterAll(async () => {
  await sequelize.close();
});
