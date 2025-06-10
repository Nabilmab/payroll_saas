require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // We only need sequelize to test connection here
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Allows server to accept JSON in request body

// --- A simple test route ---
app.get('/', (req, res) => {
  res.send('<h1>Payroll SaaS API is running!</h1>');
});

// --- Start the Server ---
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection is successful.');
    app.listen(PORT, () => {
      console.log(`🚀 Server is listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
  }
};

startServer();
