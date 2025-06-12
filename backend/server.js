const express = require('express');
const path = require('path');
require('dotenv').config();
// User model removed, sequelize kept. Auth middleware imported.
const { sequelize } = require('./models');
const { authenticateAndAttachUser } = require('./middleware/auth');

// Corrected path to existing payroll routes file
const payrollRoutes = require('./routes/payroll');

const app = express();

// Init Middleware
app.use(express.json({ extended: false }));

// Define Routes
// Other routes like auth, employees, dependents are removed as per the focus on payrollRoutes and new structure.
// If they need to be re-added, they should follow a similar pattern, potentially also using authenticateAndAttachUser.

// Payroll routes mounted as specifically requested
app.use('/api', authenticateAndAttachUser, payrollRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
  );
}

const PORT = process.env.PORT || 5000; // Or 3001 if that was the Sequelize port

// Start server with sequelize sync (optional, depends on setup)
const startServer = async () => {
  try {
    // await sequelize.sync(); // Or sequelize.authenticate()
    await sequelize.authenticate(); // More common for just checking connection
    console.log('✅ Database connection is successful (Sequelize).');

    app.listen(PORT, () => {
      console.log(`🚀 Server is listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server (Sequelize):', error);
  }
};

startServer();