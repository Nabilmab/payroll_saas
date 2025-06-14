// --- START OF UPDATED FILE ---
// ---
// backend/server.js
// ---
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const { authenticateAndAttachUser } = require('./middleware/auth');

// Import routers
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const salaryComponentRoutes = require('./routes/salaryComponents');
const payrollRunRoutes = require('./routes/payrollRuns');
const payScheduleRoutes = require('./routes/paySchedules');
const payslipRoutes = require('./routes/payslips'); // We will use this for payslip-specific routes

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware & Routes ---
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.send('<h1>Payroll SaaS API is running!</h1>'));

app.use('/api/auth', authRoutes);
app.use('/api/employees', authenticateAndAttachUser, employeeRoutes);
app.use('/api/departments', authenticateAndAttachUser, departmentRoutes);
app.use('/api/salary-components', authenticateAndAttachUser, salaryComponentRoutes);
app.use('/api/payroll-runs', authenticateAndAttachUser, payrollRunRoutes);
app.use('/api/pay-schedules', authenticateAndAttachUser, payScheduleRoutes);
app.use('/api/payslips', authenticateAndAttachUser, payslipRoutes); // Use the new specific route

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