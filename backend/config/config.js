// backend/config/config.js
const path = require('path');

// This line loads the .env file from the 'backend' directory.
// __dirname is '.../backend/config', so '../.env' points to '.../backend/.env'
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// This check provides a clear error if the .env file is missing or the variable is not set.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable not defined. Please check your backend/.env file.');
}

module.exports = {
  // We use "url" for all environments for consistency and to avoid ambiguity.
  "development": {
    "url": process.env.DATABASE_URL,
    "dialect": "postgres"
  },
  "test": {
    "url": process.env.DATABASE_URL,
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
