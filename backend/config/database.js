const { Sequelize } = require('sequelize');

// The main index.js file will load the .env variables first
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log, // We'll log SQL for now to see what's happening
  define: {
    underscored: true, // Use snake_case for table and column names
  },
});

module.exports = sequelize;