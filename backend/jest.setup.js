// backend/jest.setup.js
console.log("--- In backend/jest.setup.js ---"); // 1. Check if this file is even being run by Jest

const path = require('path');
const envPath = path.resolve(__dirname, '../.env');
console.log("Attempting to load .env from:", envPath); // 2. Check the path it's trying to load

try {
  const dotenvResult = require('dotenv').config({ path: envPath });
  if (dotenvResult.error) {
    console.error("Error loading .env file in jest.setup.js:", dotenvResult.error); // 3. Check for dotenv errors
  } else {
    console.log(".env file loaded by dotenv in jest.setup.js. Parsed vars:", Object.keys(dotenvResult.parsed || {}));
  }
} catch (e) {
  console.error("CRITICAL ERROR trying to load dotenv in jest.setup.js:", e);
}


console.log("DATABASE_URL in jest.setup.js (after dotenv attempt):", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0,20) + "..." : "NOT DEFINED"); // 4. Check the variable

const { sequelize } = require('./models'); // This will trigger database.js

if (!process.env.DATABASE_URL) {
  console.error("FATAL ERROR (jest.setup.js models require): DATABASE_URL is STILL not defined before models are required.");
  // process.exit(1); // Might be too aggressive
} else {
  console.log("SUCCESS (jest.setup.js models require): DATABASE_URL seems defined before models are required.");
}

afterAll(async () => {
  console.log("--- Closing sequelize connection in jest.setup.js afterAll ---");
  if (sequelize && typeof sequelize.close === 'function') {
    await sequelize.close();
  } else {
    console.warn("Sequelize instance or close method not available in jest.setup.js afterAll.");
  }
});
