// backend/jest.setup.js
const { sequelize } = require('./models'); // Path relative to backend/

afterAll(async () => {
  await sequelize.close();
});
