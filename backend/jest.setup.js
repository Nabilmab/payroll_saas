// C:\payroll_saas\backend\jest.setup.js
console.log("--- In backend/jest.setup.js --- CHECKPOINT 1 ---");

const path = require('path');
// __dirname here is 'C:\payroll_saas\backend'
// path.resolve(__dirname, '.env') will resolve to 'C:\payroll_saas\backend\.env'
const envPath = path.resolve(__dirname, '.env'); // <--- CHANGE IS HERE (removed '../')
console.log("--- In backend/jest.setup.js --- CHECKPOINT 2 --- Attempting to load .env from:", envPath);

try {
  const dotenvResult = require('dotenv').config({ path: envPath, debug: true });
  if (dotenvResult.error) {
    console.error("--- In backend/jest.setup.js --- CHECKPOINT 3 --- Error loading .env file:", dotenvResult.error);
  } else {
    console.log("--- In backend/jest.setup.js --- CHECKPOINT 3 --- .env file loaded by dotenv. Parsed vars:", Object.keys(dotenvResult.parsed || {}));
    if (dotenvResult.parsed && dotenvResult.parsed.DATABASE_URL) {
      console.log("--- In backend/jest.setup.js --- CHECKPOINT 3.1 --- DATABASE_URL from dotenv.parsed:", dotenvResult.parsed.DATABASE_URL.substring(0,20) + "...");
    } else {
      console.log("--- In backend/jest.setup.js --- CHECKPOINT 3.1 --- DATABASE_URL NOT in dotenv.parsed");
    }
  }
} catch (e) {
  console.error("--- In backend/jest.setup.js --- CHECKPOINT 3 --- CRITICAL ERROR trying to load dotenv:", e);
}

console.log("--- In backend/jest.setup.js --- CHECKPOINT 4 --- process.env.DATABASE_URL value:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0,20) + "..." : ">>> NOT DEFINED <<<");

const { sequelize } = require('./models');

if (!process.env.DATABASE_URL) {
  console.error("--- In backend/jest.setup.js --- CHECKPOINT 5 --- FATAL: DATABASE_URL is STILL NOT DEFINED when models were required.");
} else {
  console.log("--- In backend/jest.setup.js --- CHECKPOINT 5 --- SUCCESS: DATABASE_URL seems defined when models were required.");
}

afterAll(async () => {
  console.log("--- In backend/jest.setup.js --- CHECKPOINT 6 --- Closing sequelize connection in afterAll ---");
  if (sequelize && typeof sequelize.close === 'function') {
    await sequelize.close();
  } else {
    console.warn("--- In backend/jest.setup.js --- CHECKPOINT 6 --- Sequelize instance or close method not available in afterAll.");
  }
});