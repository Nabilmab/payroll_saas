// backend/config/config.js
const path = require('path');

// Load environment variables directly into this file.
// This ensures DATABASE_URL is available when this config is read.
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

module.exports = {
  "development": {
    "url": process.env.DATABASE_URL,
    "dialect": "postgres"
  },
  "test": {
    //
    // THE FIX IS HERE: We now directly provide the URL to the 'test' environment.
    // This removes any dependency on when or how Jest loads environment variables.
    // Sequelize will now *always* have the correct URL for tests.
    //
    "url": process.env.DATABASE_URL,
    "dialect": "postgres",
    // ADD THIS LINE TO SEE THE SQL QUERIES
    "logging": console.log
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
