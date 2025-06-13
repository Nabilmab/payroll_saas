const express = require('express');
const cors = require('cors');
// Only require what's needed for this file.
const { sequelize } = require('./models');
const { authenticateAndAttachUser } = require('./middleware/auth');

// Import routers
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
// REMOVED: const dependentRoutes = require('./routes/dependents');
const payrollRoutes = require('./routes/payroll');
const salaryComponentRoutes = require('./routes/salaryComponents');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware & Routes ---
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.send('<h1>Payroll SaaS API is running!</h1>'));

app.use('/api/auth', authRoutes);
app.use('/api/employees', authenticateAndAttachUser, employeeRoutes);
// REMOVED: app.use('/api/dependents', authenticateAndAttachUser, dependentRoutes);
app.use('/api', authenticateAndAttachUser, payrollRoutes);
app.use('/api/salary-components', authenticateAndAttachUser, salaryComponentRoutes);

// --- Server Startup Logic ---
const startServer = async () => {
  if (require.main === module) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection is successful.');
      app.listen(PORT, () => console.log(`🚀 Server is listening on http://localhost:${PORT}`));
    } catch (error) {
      console.error('❌ Unable to start server:', error);
      process.exit(1);
    }
  }
};

startServer();

module.exports = app;