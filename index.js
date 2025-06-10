require('dotenv').config();

// We will create this 'db' object in the next steps. It will contain all our models.
const db = require('./models');

const startApp = async () => {
  try {
    // Test the connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection is successful.');

    // This command reads all your model definitions and creates the tables in the database if they don't exist.
    // Use { force: true } only in development to drop and recreate tables.
    // In production, you will use migrations instead.
    await db.sequelize.sync(); 
    console.log('✅ All models were synchronized successfully.');

  } catch (error) {
    console.error('❌ An error occurred:', error);
  } finally {
    // We can close the connection now that setup is done for this script.
    // In a real web server, you would keep the connection open.
    await db.sequelize.close();
  }
};

startApp();