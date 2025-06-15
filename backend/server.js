import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { authenticateAndAttachUser } from './middleware/auth.js';

// --- Import Routers ---
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import departmentRoutes from './routes/departments.js';
import salaryComponentRoutes from './routes/salaryComponents.js';
import payrollRunRoutes from './routes/payrollRuns.js';
import payScheduleRoutes from './routes/paySchedules.js';
import payslipRoutes from './routes/payslips.js';
import tenantAdminRoutes from './routes/tenantAdmin.js'; // <-- IMPORT THIS

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.send('<h1>Payroll SaaS API is running! (Powered by Prisma)</h1>'));

// --- API Routes ---
// Public routes
app.use('/api/auth', authRoutes);

// Protected routes (all use the authentication middleware)
app.use('/api/admin', tenantAdminRoutes); // <-- ADD THIS LINE
app.use('/api/departments', authenticateAndAttachUser, departmentRoutes);
app.use('/api/employees', authenticateAndAttachUser, employeeRoutes);
app.use('/api/salary-components', authenticateAndAttachUser, salaryComponentRoutes);
app.use('/api/payroll-runs', authenticateAndAttachUser, payrollRunRoutes);
app.use('/api/pay-schedules', authenticateAndAttachUser, payScheduleRoutes);
app.use('/api/payslips', authenticateAndAttachUser, payslipRoutes);

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`🚀 Server is listening on http://localhost:${PORT}`));
}

export default app;