// Explicitly load .env from the project root
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
// Only import models that are used in *this* file (server.js)
const { User, sequelize } = require('./models'); // Assuming Employee, Department, EmployeeDependent, Payslip, PayrollRun, PayslipItem, SalaryComponent are not directly used here or will be removed

// Import your new router
const salaryComponentRoutes = require('./routes/salaryComponents');
// You will import other routers here as you create them
// const employeeRoutes = require('./routes/employees');
// const dependentRoutes = require('./routes/dependents');
// ... etc

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 

// --- A simple test route ---
app.get('/', (req, res) => {
  res.send('<h1>Payroll SaaS API is running!</h1>');
});

// --- LOGIN ROUTE (This one is working correctly) ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isPasswordValid = user.validPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    const user_data = user.toJSON();
    delete user_data.password_hash;

    res.json({
      message: 'Login successful!',
      user: user_data,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// FAKE Authentication Middleware
const authenticateAndAttachUser = async (req, res, next) => {
    try {
        const loggedInUser = await User.findOne({ 
            where: { email: 'manager.rh@techsolutions.ma' }
        });

        if (!loggedInUser) {
            return res.status(401).json({ error: 'Mock Authentication: User not found for testing.' });
        }
        req.user = loggedInUser; 
        next();
    } catch (error) {
        console.error("Mock auth error:", error);
        return res.status(500).json({ error: "Mock auth failed." });
    }
};

// --- API ROUTES ---
// Mount the router. All routes in salaryComponents.js will now be prefixed with /api/salary-components
// and will have the authentication middleware run first.
app.use('/api/salary-components', authenticateAndAttachUser, salaryComponentRoutes);


// Placeholder for other old routes that might still exist.
// These should be refactored into their own route files eventually.

// Example: EMPLOYEES ROUTE (To be moved)
// app.get('/api/employees', authenticateAndAttachUser, async (req, res) => { ... });

// Example: EMPLOYEE DEPENDENTS ROUTES (To be moved)
// app.post('/api/employees/:employeeId/dependents', authenticateAndAttachUser, async (req, res) => { ... });
// app.get('/api/employees/:employeeId/dependents', authenticateAndAttachUser, async (req, res) => { ... });
// app.get('/api/dependents/:dependentId', authenticateAndAttachUser, async (req, res) => { ... });
// app.put('/api/dependents/:dependentId', authenticateAndAttachUser, async (req, res) => { ... });
// app.delete('/api/dependents/:dependentId', authenticateAndAttachUser, async (req, res) => { ... });

// Example: YTD SUMMARY ROUTE (To be moved)
// app.get('/api/employees/:employeeId/ytd-summary', authenticateAndAttachUser, async (req, res) => { ... });

// Example: PAYSLIP ROUTES (To be moved)
// app.get('/api/payslips/:payslipId', authenticateAndAttachUser, async (req, res) => { ... });
// app.get('/api/employees/:employeeId/payslips', authenticateAndAttachUser, async (req, res) => { ... });


// --- Start the Server ---
const startServer = async () => {
  // This check ensures the server only starts when you run `node server.js`
  // and not when it's `require`d by a test file.
  if (require.main === module) {
    try { // This is the try block that was missing its catch/finally
      await sequelize.authenticate();
      console.log('✅ Database connection is successful.');

      app.listen(PORT, () => {
        console.log(`🚀 Server is listening on http://localhost:${PORT}`);
      });
    } catch (error) { // Added catch block
      console.error('❌ Unable to start server:', error);
      process.exit(1);
    }
  }
};

startServer();

// Export the app for testing purposes
module.exports = app;