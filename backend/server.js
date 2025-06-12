const express = require('express');
const path = require('path');
require('dotenv').config();
// Specific import as requested
const { User, sequelize } = require('./models');

// Corrected path to existing payroll routes file
const payrollRoutes = require('./routes/payroll');

const app = express();

// Init Middleware
app.use(express.json({ extended: false }));

// FAKE Authentication Middleware (re-created based on previous observation of such a middleware)
// This is a placeholder and would need a proper implementation
const authenticateAndAttachUser = async (req, res, next) => {
    try {
        // This is a mock user fetch. In a real app, this would involve token validation etc.
        // Using a known email from potential seed data or test cases.
        const loggedInUser = await User.findOne({
            where: { email: 'manager.rh@techsolutions.ma' } // Example email
        });

        if (!loggedInUser) {
            // If no user found, for testing, we might allow routes to proceed without req.user
            // or return an error, depending on strictness. For now, proceed.
            console.warn('Mock Authentication: User not found for testing with email manager.rh@techsolutions.ma. Proceeding without req.user.');
            return next();
        }
        req.user = loggedInUser;
        next();
    } catch (error) {
        console.error("Mock auth error:", error);
        // Even with an error, proceed so app doesn't hang, but log it.
        // In a real app, might return 500.
        next();
    }
};

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