// backend/__tests__/api.integration.test.js

const request = require('supertest');
// Important: Adjust path to your models and seed script relative to THIS FILE's location
const { sequelize, Employee, Tenant, EmployeeDependent, PayrollRun, Payslip, PayslipItem, SalaryComponent, PaySchedule } = require('../models');
const { employeesData, tenantsData, employeeDependentsData } = require('../scripts/seed'); // Assuming seed.js exports these

const API_BASE_URL = 'http://localhost:3001'; // Ensure your server is running on this port for these tests

let ahmedBennaniEmployeeId;
let techSolutionsTenantId;
let fatimaZahraEmployeeId;
let khalidBennaniDependentId;

describe('Payroll SaaS API Integration Tests', () => {

    beforeAll(async () => {
        try {
            await sequelize.authenticate();
            console.log('Database connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            // It might be useful to throw the error here to stop tests if DB is not available
            // throw new Error('Database connection failed, stopping tests.');
        }

        // Ensure the server is running if testing against a live dev server.
        // For more isolated tests, you'd import your app from server.js and pass it to request(app).

        const techSolutionsSeed = tenantsData.find(t => t.schema_name === 'techsolutions');
        if (!techSolutionsSeed) throw new Error("TechSolutions SARL tenant data not found in imported seed data.");
        const tenantInstance = await Tenant.findOne({ where: { schema_name: techSolutionsSeed.schema_name } });
        if (!tenantInstance) throw new Error("TechSolutions SARL tenant not found in DB. Ensure DB is seeded before running tests.");
        techSolutionsTenantId = tenantInstance.id;

        const ahmedDataSeed = employeesData.find(e => e.email === 'dev.ahmed@techsolutions.ma' && e.tenantName === techSolutionsSeed.name);
        if (!ahmedDataSeed) throw new Error("Ahmed Bennani employee data not found in imported seed data.");
        const ahmedInstance = await Employee.findOne({ where: { email: ahmedDataSeed.email, tenantId: techSolutionsTenantId } });
        if (!ahmedInstance) throw new Error("Ahmed Bennani employee not found in DB. Ensure DB is seeded.");
        ahmedBennaniEmployeeId = ahmedInstance.id;

        const fatimaZahraDataSeed = employeesData.find(e => e.email === 'manager.rh@techsolutions.ma' && e.tenantName === techSolutionsSeed.name);
        if(!fatimaZahraDataSeed) throw new Error("Fatima Zahra (manager) employee data not found in imported seed data for YTD test.");
        const fatimaZahraInstance = await Employee.findOne({where: {email: fatimaZahraDataSeed.email, tenantId: techSolutionsTenantId}});
        if(!fatimaZahraInstance) throw new Error("Fatima Zahra (manager) employee not found in DB for YTD test.");
        fatimaZahraEmployeeId = fatimaZahraInstance.id;

        // Clean up potential leftover from previous failed test run
        await EmployeeDependent.destroy({
            where: {
                employeeId: ahmedBennaniEmployeeId,
                full_name: "Khalid Bennani Test"
            },
            force: true
        });
    });

    // afterAll is now handled by jest.setup.js if you use it for sequelize.close()

    // --- Employee Dependents API Tests ---
    describe('Employee Dependents API', () => {
        const newDependentPayload = {
            full_name: "Khalid Bennani Test",
            relationship: "child",
            date_of_birth: "2024-01-15",
            is_fiscally_dependent: true,
            notes: "Test dependent created by automated test"
        };

        it('POST /api/employees/:employeeId/dependents - should create a new dependent successfully', async () => {
            const response = await request(API_BASE_URL)
                .post(`/api/employees/${ahmedBennaniEmployeeId}/dependents`)
                .send(newDependentPayload);

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('id');
            khalidBennaniDependentId = response.body.id;
            expect(response.body.full_name).toBe(newDependentPayload.full_name);
            expect(response.body.employeeId).toBe(ahmedBennaniEmployeeId);
            expect(response.body.tenantId).toBe(techSolutionsTenantId);
        });

        // ... (Include all other dependent tests from the previous script:
        //      - POST fail 400 invalid UUID
        //      - POST fail 404 non-existent employee
        //      - POST fail 409 duplicate
        //      - GET all active
        //      - GET specific
        //      - PUT update
        //      - PUT set inactive
        //      - DELETE soft delete
        // )
        // For brevity, I'll skip pasting them all again here but assume they are included.
        // Ensure you paste them from the script I provided in the message where you confirmed "npm run db:seed" worked.

         it('POST /api/employees/:employeeId/dependents - should fail with 400 for invalid employeeId UUID format', async () => {
            const response = await request(API_BASE_URL)
                .post('/api/employees/invalid-uuid/dependents')
                .send(newDependentPayload);
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe("Invalid employee ID format. Please provide a valid UUID.");
        });

        it('POST /api/employees/:employeeId/dependents - should fail with 404 if employeeId does not exist', async () => {
            const nonExistentUUID = '123e4567-e89b-12d3-a456-426614174000';
            const response = await request(API_BASE_URL)
                .post(`/api/employees/${nonExistentUUID}/dependents`)
                .send(newDependentPayload);
            expect(response.statusCode).toBe(404);
        });


        it('POST /api/employees/:employeeId/dependents - should fail with 409 for duplicate dependent profile', async () => {
            expect(khalidBennaniDependentId).toBeDefined();
            const response = await request(API_BASE_URL)
                .post(`/api/employees/${ahmedBennaniEmployeeId}/dependents`)
                .send(newDependentPayload); // Sending the same payload again
            expect(response.statusCode).toBe(409);
        });


        it('GET /api/employees/:employeeId/dependents - should retrieve all active dependents for Ahmed Bennani', async () => {
            const response = await request(API_BASE_URL)
                .get(`/api/employees/${ahmedBennaniEmployeeId}/dependents`);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            const seededAisha = employeeDependentsData.find(d => d.employeeEmail === 'dev.ahmed@techsolutions.ma' && d.full_name === "Aisha Bennani");
            const foundAisha = response.body.find(d => d.full_name === "Aisha Bennani");
            expect(foundAisha).toBeDefined();
            const foundKhalidTest = response.body.find(d => d.id === khalidBennaniDependentId);
            expect(foundKhalidTest).toBeDefined();
            expect(foundKhalidTest.full_name).toBe(newDependentPayload.full_name);
        });

        it('GET /api/dependents/:dependentId - should retrieve a specific dependent', async () => {
            expect(khalidBennaniDependentId).toBeDefined();
            const response = await request(API_BASE_URL)
                .get(`/api/dependents/${khalidBennaniDependentId}`);
            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(khalidBennaniDependentId);
            expect(response.body.full_name).toBe(newDependentPayload.full_name);
        });

        it('PUT /api/dependents/:dependentId - should update a dependent successfully', async () => {
            expect(khalidBennaniDependentId).toBeDefined();
            const updatePayload = {
                notes: "Updated notes field by automated test",
                is_fiscally_dependent: false
            };
            const response = await request(API_BASE_URL)
                .put(`/api/dependents/${khalidBennaniDependentId}`)
                .send(updatePayload);
            expect(response.statusCode).toBe(200);
            expect(response.body.notes).toBe(updatePayload.notes);
            expect(response.body.is_fiscally_dependent).toBe(false);
        });

        it('PUT /api/dependents/:dependentId - should set effective_end_date to make a dependent inactive', async () => {
            const aishaData = employeeDependentsData.find(d => d.employeeEmail === 'dev.ahmed@techsolutions.ma' && d.full_name === "Aisha Bennani");
            const aishaDb = await EmployeeDependent.findOne({where: {full_name: aishaData.full_name, employeeId: ahmedBennaniEmployeeId}});
            expect(aishaDb).toBeDefined();

            const endDatePayload = { effective_end_date: "2023-12-31" };
            const response = await request(API_BASE_URL)
                .put(`/api/dependents/${aishaDb.id}`)
                .send(endDatePayload);
            expect(response.statusCode).toBe(200);
            expect(response.body.effective_end_date).toBe("2023-12-31");

            const activeDependentsResponse = await request(API_BASE_URL)
                .get(`/api/employees/${ahmedBennaniEmployeeId}/dependents`);
            const foundAishaAgain = activeDependentsResponse.body.find(d => d.id === aishaDb.id);
            expect(foundAishaAgain).toBeUndefined();

             await request(API_BASE_URL) // Re-activate
                .put(`/api/dependents/${aishaDb.id}`)
                .send({ effective_end_date: null });
        });


        it('DELETE /api/dependents/:dependentId - should soft delete a dependent', async () => {
            expect(khalidBennaniDependentId).toBeDefined();
            const response = await request(API_BASE_URL)
                .delete(`/api/dependents/${khalidBennaniDependentId}`);
            expect(response.statusCode).toBe(204);

            const activeListResponse = await request(API_BASE_URL)
                .get(`/api/employees/${ahmedBennaniEmployeeId}/dependents`);
            const foundDeleted = activeListResponse.body.find(d => d.id === khalidBennaniDependentId);
            expect(foundDeleted).toBeUndefined();

            const dbCheck = await EmployeeDependent.findByPk(khalidBennaniDependentId, { paranoid: false });
            expect(dbCheck).not.toBeNull();
            expect(dbCheck.deletedAt).not.toBeNull();
        });
    });


    // --- YTD Summary API Tests ---
    describe('YTD Summary API', () => {
        let testPayrollRunId;
        let testPayslipId;

        beforeAll(async () => {
            // Setup minimal data for YTD tests
            const techSolutionsPayrollSchedule = await PaySchedule.findOne({
                where: { name: "Paiement Mensuel Standard", tenantId: techSolutionsTenantId }
            });
            if (!techSolutionsPayrollSchedule) throw new Error("Paiement Mensuel Standard schedule not found for YTD test.");

            const testRunDate = new Date('2024-01-31'); // Use a consistent date for predictability
            console.log('YTD beforeAll - techSolutionsTenantId:', techSolutionsTenantId);
            console.log('YTD beforeAll - techSolutionsPayrollSchedule.id:', techSolutionsPayrollSchedule ? techSolutionsPayrollSchedule.id : 'PaySchedule NOT FOUND');
            console.log('YTD beforeAll - testRunDate:', testRunDate);
            const [payrollRunInstance] = await PayrollRun.findOrCreate({
                where: { tenantId: techSolutionsTenantId, payScheduleId: techSolutionsPayrollSchedule.id, periodEnd: testRunDate },
                defaults: { periodStart: new Date('2024-01-01'), paymentDate: new Date('2024-02-05'), status: 'completed' }
            });
            testPayrollRunId = payrollRunInstance.id;

            const [payslipInstance] = await Payslip.findOrCreate({
                where: { employeeId: ahmedBennaniEmployeeId, payrollRunId: testPayrollRunId },
                defaults: { tenantId: techSolutionsTenantId, grossPay: 6000.00, deductions: 250.00, taxes: 950.00, netPay: 4800.00 }
            });
            testPayslipId = payslipInstance.id;

            const baseSalaryComp = await SalaryComponent.findOne({ where: { component_code: 'BASE_SALARY_MONTHLY', tenantId: techSolutionsTenantId }});
            const cnssComp = await SalaryComponent.findOne({ where: { component_code: 'CNSS_EMPLOYEE', tenantId: techSolutionsTenantId }});

            if (baseSalaryComp) {
                await PayslipItem.findOrCreate({
                    where: { payslipId: testPayslipId, salaryComponentId: baseSalaryComp.id },
                    defaults: { tenantId: techSolutionsTenantId, description: baseSalaryComp.name, type: 'earning', amount: 6000.00 }
                });
            }
            if (cnssComp) {
                await PayslipItem.findOrCreate({
                    where: { payslipId: testPayslipId, salaryComponentId: cnssComp.id },
                    defaults: { tenantId: techSolutionsTenantId, description: cnssComp.name, type: 'deduction', amount: 404.40 } // 6000 * 0.0674
                });
            }
        });

        afterAll(async () => { // Clean up YTD specific test data
            if (testPayslipId) {
                await PayslipItem.destroy({ where: { payslipId: testPayslipId }, force: true });
                await Payslip.destroy({ where: { id: testPayslipId }, force: true });
            }
            if (testPayrollRunId) {
                await PayrollRun.destroy({ where: { id: testPayrollRunId }, force: true });
            }
        });

        it('GET /api/employees/:employeeId/ytd-summary - should return YTD summary for Ahmed Bennani', async () => {
            const response = await request(API_BASE_URL)
                .get(`/api/employees/${ahmedBennaniEmployeeId}/ytd-summary?periodEndDate=2024-03-31`); // Period includes Jan payslip

            expect(response.statusCode).toBe(200);
            expect(response.body.grossPay).toBe(6000.00);
            expect(response.body.netPay).toBe(4800.00);
            expect(response.body.items['BASE_SALARY_MONTHLY'].amount).toBe(6000.00);
            expect(response.body.items['CNSS_EMPLOYEE'].amount).toBe(404.40);
        });

        // ... (Include all other YTD tests from the previous script:
        //      - zeroed summary for employee with no payslips
        //      - 400 missing periodEndDate
        //      - 400 invalid periodEndDate
        //      - 404 non-existent employee
        // )
        it('GET /api/employees/:employeeId/ytd-summary - should return zeroed YTD summary for an employee with no payslips in the period', async () => {
            const response = await request(API_BASE_URL)
                .get(`/api/employees/${fatimaZahraEmployeeId}/ytd-summary?periodEndDate=2024-12-31`);

            expect(response.statusCode).toBe(200);
            expect(response.body.grossPay).toBe(0);
            // ... other zero checks
        });

        it('GET /api/employees/:employeeId/ytd-summary - should fail with 400 if periodEndDate is missing', async () => {
            const response = await request(API_BASE_URL)
                .get(`/api/employees/${ahmedBennaniEmployeeId}/ytd-summary`);
            expect(response.statusCode).toBe(400);
        });
        // ... more YTD tests
    });
});
