const request = require('supertest');
const app = require('../server'); // Your refactored app
const { sequelize, Tenant, User, Department, Employee, EmployeeDependent, SalaryComponent, PayrollRun, Payslip, PayslipItem, PaySchedule } = require('../models');

// --- MOCK THE AUTHENTICATION MIDDLEWARE ---
const mockUser = {
  id: 1, // Ensure this matches any foreign key relations if needed
  tenantId: 1,
  email: 'manager.rh@techsolutions.ma',
  toJSON: () => ({ id: 1, tenantId: 1, email: 'manager.rh@techsolutions.ma' })
};

// This tells Jest: whenever any file (like server.js) tries to require('../middleware/auth'),
// give them this mock object instead of the real file.
jest.mock('../middleware/auth', () => ({
  authenticateAndAttachUser: (req, res, next) => {
    // Attach the mock user to the request object
    req.user = mockUser;
    // Continue to the actual route handler
    next();
  }
}));
// --- END OF MOCK ---

// Use a consistent API_BASE_URL (it's good practice, though not strictly needed if 'app' is used directly)
const API_BASE_URL = 'http://localhost:3001';

// --- Main Test Suite ---
describe('Payroll SaaS API Integration Tests', () => {
    let techSolutionsTenantId;
    let ahmedBennaniEmployeeId;
    let khalidBennaniDependentId;
    let testPayslipId;

    beforeAll(async () => {
        // --- START OF DEBUG CODE ---
        try {
            console.log('--- RUNNING DEBUG QUERY ---');
            const [results, metadata] = await sequelize.query(`
                SELECT table_name, column_name, data_type
                FROM information_schema.columns
                WHERE table_name IN ('payroll_runs', 'employee_dependents');
            `);
            console.log('--- SCHEMA DEBUG RESULTS ---');
            console.table(results);
            console.log('--- END OF DEBUG ---');
        } catch (error) {
            console.error('--- DEBUG QUERY FAILED ---', error.message);
            // We don't want to stop the test here, let it fail on its own
        }
        // --- END OF DEBUG CODE ---

        // Drop and recreate the schema manually
        await sequelize.query('DROP SCHEMA IF EXISTS techsolutions CASCADE');
        await sequelize.query('CREATE SCHEMA IF NOT EXISTS techsolutions');

        // Sync models to the schema
        await sequelize.sync({ force: true });

        // Seed data
        const tenant = await Tenant.create({ name: "TechSolutions Inc.", country: "MA", schemaName: "techsolutions" });
        techSolutionsTenantId = tenant.id;
        mockUser.tenantId = tenant.id; // Align mock user with the created tenant

        const rhDepartment = await Department.create({ name: "Ressources Humaines", tenantId: techSolutionsTenantId });
        const itDepartment = await Department.create({ name: "Technologie de l'Information", tenantId: techSolutionsTenantId });

        const monthlySchedule = await PaySchedule.create({
            name: "Mensuel",
            frequency: "monthly",
            payDayOfMonth: 28, // Added missing required-like field
            tenantId: techSolutionsTenantId
        });

        const ahmed = await Employee.create({
            firstName: "Ahmed",
            lastName: "Bennani",
            email: "ahmed.bennani@techsolutions.ma",
            jobTitle: "Développeur Principal",
            departmentId: itDepartment.id,
            tenantId: techSolutionsTenantId,
            // payScheduleId: monthlySchedule.id // This field doesn't exist on Employee model
        });
        ahmedBennaniEmployeeId = ahmed.id;

        const khalid = await EmployeeDependent.create({
            fullName: "Khalid Bennani",
            relationship: "child",
            dateOfBirth: "2010-05-15",
            isFiscallyDependent: true,
            effectiveStartDate: new Date(),
            employeeId: ahmedBennaniEmployeeId,
            tenantId: techSolutionsTenantId
        });
        khalidBennaniDependentId = khalid.id;

        const payrollRun = await PayrollRun.create({
            periodStart: '2023-01-01',
            periodEnd: '2023-01-31',
            paymentDate: '2023-02-05',
            status: 'paid',
            tenantId: techSolutionsTenantId,
            payScheduleId: monthlySchedule.id
        });

        const payslip = await Payslip.create({
            grossPay: 5000,
            netPay: 4000,
            deductions: 800,
            taxes: 200,
            notes: 'Payslip de test pour Janvier',
            payrollRunId: payrollRun.id,
            employeeId: ahmedBennaniEmployeeId,
            tenantId: techSolutionsTenantId,
        });
        testPayslipId = payslip.id;
    });

    afterAll(async () => {
        // Close the database connection
        await sequelize.close();
    });

    describe('Employee Dependents API', () => {
        it('POST /api/employees/:employeeId/dependents - should create a new dependent successfully', async () => {
            const newDependentPayload = {
                fullName: "Fatima Bennani",
                relationship: "child",
                dateOfBirth: "2012-08-20",
                isFiscallyDependent: true
            };

            // Use the app directly with request
            const response = await request(app)
                .post(`/api/employees/${ahmedBennaniEmployeeId}/dependents`)
                .send(newDependentPayload);

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('id');
            // FIX: The API response uses camelCase (fullName), not snake_case (full_name).
            expect(response.body.fullName).toBe("Fatima Bennani");
        });
    });
});