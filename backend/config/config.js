// --- START OF UPDATED FILE ---
// ---
// backend/config/config.js
// ---
const path = require('path');

// This line loads the .env file from the 'backend' directory.
// __dirname is '.../backend/config', so '../.env' points to '.../backend/.env'
// This ensures that environment variables are loaded before anything else in this file is executed.
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// This check provides a clear error if the environment variables are not loaded correctly.
if (!process.env.DATABASE_URL || !process.env.TEST_DATABASE_URL) {
  throw new Error('DATABASE_URL or TEST_DATABASE_URL environment variable not defined. Please check your backend/.env file.');
}

module.exports = {
  "development": {
    "url": process.env.DATABASE_URL,
    "dialect": "postgres"
  },
  "test": {
    "url": process.env.TEST_DATABASE_URL,
    "dialect": "postgres"
  },
  "production": {
    "url": process.env.DATABASE_URL,
    "dialect": "postgres",
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    }
  }
};