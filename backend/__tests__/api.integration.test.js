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
        let janPayrollRunId, febPayrollRunId;
        let janPayslipId, febPayslipId; // janPayslipId will be assigned to testPayslipId for other tests

        beforeAll(async () => {
            // Ensure tenantId and employeeId are available
            if (!techSolutionsTenantId || !ahmedBennaniEmployeeId) {
                throw new Error("Tenant ID or Employee ID is not set. Ensure global beforeAll ran correctly.");
            }

            // Simplified Setup for YTD tests - focusing on what's needed for YTD logic
            const techSolutionsPayrollSchedule = await PaySchedule.findOne({
                where: { name: "Paiement Mensuel Standard", tenantId: techSolutionsTenantId }
            });
            if (!techSolutionsPayrollSchedule) {
                console.error("Paiement Mensuel Standard schedule not found for YTD test. TenantId:", techSolutionsTenantId);
                throw new Error("Paiement Mensuel Standard schedule not found for YTD test.");
            }

            // Create a PayrollRun for Jan 2024
            const janRunDate = new Date('2024-01-31T00:00:00.000Z');
            const janPayrollRun = await PayrollRun.create({
                tenantId: techSolutionsTenantId,
                payScheduleId: techSolutionsPayrollSchedule.id,
                periodStart: new Date('2024-01-01T00:00:00.000Z'),
                periodEnd: janRunDate,
                paymentDate: new Date('2024-02-05T00:00:00.000Z'),
                status: 'completed'
            });
            janPayrollRunId = janPayrollRun.id;
            testPayrollRunId = janPayrollRunId; // Keep testPayrollRunId for compatibility if other parts of code use it by that name

            // Create a Payslip for Ahmed Bennani for Jan 2024
            const [janPayslip] = await Payslip.findOrCreate({
                where: {
                    employeeId: ahmedBennaniEmployeeId,
                    payrollRunId: janPayrollRun.id
                },
                defaults: {
                    tenantId: techSolutionsTenantId,
                    grossPay: 6200.00, // Slightly different gross for Jan
                    deductions: 250.00,
                    taxes: 980.00,
                    netPay: 4970.00
                }
            });
            janPayslipId = janPayslip.id;
            testPayslipId = janPayslipId; // This is the one used by Payslip API tests too

            const baseSalaryComp = await SalaryComponent.findOne({ where: { component_code: 'BASE_SALARY_MONTHLY', tenantId: techSolutionsTenantId }});
            const cnssComp = await SalaryComponent.findOne({ where: { component_code: 'CNSS_EMPLOYEE', tenantId: techSolutionsTenantId }});
            const transportAllowanceComp = await SalaryComponent.findOne({ where: { component_code: 'TRANSPORT_ALLOWANCE_MONTHLY', tenantId: techSolutionsTenantId }});

            if (!baseSalaryComp || !cnssComp || !transportAllowanceComp) {
                throw new Error("One or more required salary components for YTD/Payslip tests are missing from the database.");
            }

            // PayslipItems for Jan Payslip
            await PayslipItem.findOrCreate({
                where: { payslipId: janPayslip.id, salaryComponentId: baseSalaryComp.id },
                defaults: { tenantId: techSolutionsTenantId, description: baseSalaryComp.name, type: 'earning', amount: 6000.00 }
            });
            await PayslipItem.findOrCreate({
                where: { payslipId: janPayslip.id, salaryComponentId: transportAllowanceComp.id },
                defaults: { tenantId: techSolutionsTenantId, description: transportAllowanceComp.name, type: 'earning', amount: 200.00 }
            });
            await PayslipItem.findOrCreate({
                where: { payslipId: janPayslip.id, salaryComponentId: cnssComp.id },
                defaults: { tenantId: techSolutionsTenantId, description: cnssComp.name, type: 'deduction', amount: 417.88 } // (6000+200)*0.0674
            });


            // Create a PayrollRun for Feb 2024
            const febRunDate = new Date('2024-02-29T00:00:00.000Z');
            const febPayrollRun = await PayrollRun.create({
                tenantId: techSolutionsTenantId,
                payScheduleId: techSolutionsPayrollSchedule.id,
                periodStart: new Date('2024-02-01T00:00:00.000Z'),
                periodEnd: febRunDate,
                paymentDate: new Date('2024-03-05T00:00:00.000Z'),
                status: 'completed'
            });
            febPayrollRunId = febPayrollRun.id;

            // Create a Payslip for Ahmed Bennani for Feb 2024 (different amounts)
            const [febPayslip] = await Payslip.findOrCreate({
                where: {
                    employeeId: ahmedBennaniEmployeeId,
                    payrollRunId: febPayrollRunId // Use febPayrollRunId here
                },
                defaults: {
                    tenantId: techSolutionsTenantId,
                    grossPay: 6300.00,
                    deductions: 260.00,
                    taxes: 1000.00,
                    netPay: 5040.00
                }
            });
            febPayslipId = febPayslip.id;

             // PayslipItems for Feb Payslip
            await PayslipItem.findOrCreate({
                where: { payslipId: febPayslipId, salaryComponentId: baseSalaryComp.id },
                defaults: { tenantId: techSolutionsTenantId, description: baseSalaryComp.name, type: 'earning', amount: 6000.00 }
            });
            await PayslipItem.findOrCreate({
                where: { payslipId: febPayslipId, salaryComponentId: transportAllowanceComp.id },
                defaults: { tenantId: techSolutionsTenantId, description: transportAllowanceComp.name, type: 'earning', amount: 300.00 } // Increased transport
            });
            await PayslipItem.findOrCreate({
                where: { payslipId: febPayslipId, salaryComponentId: cnssComp.id },
                defaults: { tenantId: techSolutionsTenantId, description: cnssComp.name, type: 'deduction', amount: 424.62 } // (6000+300)*0.0674
            });

            // Minimal setup for Fatima Zahra (manager) - assumed to have no payslips for some tests
            // This employee (fatimaZahraEmployeeId) should already be created in the global beforeAll
            // No specific payslips are created for her here, so YTD should be zero unless other tests create them.

            console.log(`YTD beforeAll: Created Jan Payslip (${janPayslipId}) and Feb Payslip (${febPayslipId}) for employee ${ahmedBennaniEmployeeId}`);
        });

        afterAll(async () => {
            console.log(`YTD afterAll: Cleaning up test data. Jan Payslip ID: ${janPayslipId}, Feb Payslip ID: ${febPayslipId}`);
            console.log(`YTD afterAll: Cleaning up test data. Jan PayrollRun ID: ${janPayrollRunId}, Feb PayrollRun ID: ${febPayrollRunId}`);

            // Delete PayslipItems first
            if (janPayslipId) {
                await PayslipItem.destroy({ where: { payslipId: janPayslipId }, force: true });
            }
            if (febPayslipId) {
                await PayslipItem.destroy({ where: { payslipId: febPayslipId }, force: true });
            }

            // Then delete Payslips
            if (janPayslipId) {
                await Payslip.destroy({ where: { id: janPayslipId }, force: true });
            }
            if (febPayslipId) {
                await Payslip.destroy({ where: { id: febPayslipId }, force: true });
            }

            // Finally, delete PayrollRuns
            // Note: testPayrollRunId is janPayrollRunId
            if (janPayrollRunId) {
                await PayrollRun.destroy({ where: { id: janPayrollRunId }, force: true });
            }
            if (febPayrollRunId && febPayrollRunId !== janPayrollRunId) { // Ensure not trying to delete same run twice
                await PayrollRun.destroy({ where: { id: febPayrollRunId }, force: true });
            }
            // Reset global vars to avoid interference if tests were to run in a leaky way (though Jest isolates)
            janPayslipId = null;
            febPayslipId = null;
            janPayrollRunId = null;
            febPayrollRunId = null;
            testPayslipId = null; // This was aliasing janPayslipId
            testPayrollRunId = null; // This was aliasing janPayrollRunId
        });

        it('GET /api/employees/:employeeId/ytd-summary - should return YTD summary for Ahmed Bennani', async () => {
            const response = await request(API_BASE_URL)
                .get(`/api/employees/${ahmedBennaniEmployeeId}/ytd-summary?periodEndDate=2024-03-31`); // Period includes Jan payslip

            expect(response.statusCode).toBe(200);
            expect(response.body.grossPay).toBe(12500.00); // Sum of Jan (6200) and Feb (6300)
            expect(response.body.netPay).toBe(10010.00); // Sum of Jan (4970) and Feb (5040)
            expect(response.body.items['BASE_SALARY_MONTHLY'].amount).toBe(12000.00); // 6000 (Jan) + 6000 (Feb)
            expect(response.body.items['TRANSPORT_ALLOWANCE_MONTHLY'].amount).toBe(500.00); // 200 (Jan) + 300 (Feb)
            expect(response.body.items['CNSS_EMPLOYEE'].amount).toBe(842.50); // 417.88 (Jan) + 424.62 (Feb)
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

    // --- Payslip API Tests ---
    describe('Payslip API', () => {
        it('GET /api/payslips/:payslipId - should retrieve a specific payslip for Ahmed Bennani', async () => {
            // testPayslipId is created in the YTD Summary's beforeAll
            expect(testPayslipId).toBeDefined();

            const response = await request(API_BASE_URL)
                .get(`/api/payslips/${testPayslipId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('id', testPayslipId);
            expect(response.body).toHaveProperty('employeeId', ahmedBennaniEmployeeId);
            expect(response.body).toHaveProperty('tenantId', techSolutionsTenantId);
            expect(response.body).toHaveProperty('grossPay', 6200.00); // Jan payslip's grossPay
            expect(response.body.items).toBeDefined();
            // Expect 3 items for Jan payslip: Base Salary, Transport Allowance, CNSS
            expect(response.body.items.length).toBe(3);


            const baseSalaryItem = response.body.items.find(item => item.description === 'Salaire de Base Mensuel');
            expect(baseSalaryItem).toBeDefined();
            expect(baseSalaryItem.amount).toBe(6000.00);

            const transportItem = response.body.items.find(item => item.description === 'Indemnité de Transport Mensuelle');
            expect(transportItem).toBeDefined();
            expect(transportItem.amount).toBe(200.00);

            const cnssItem = response.body.items.find(item => item.description === 'CNSS (Employé)');
            expect(cnssItem).toBeDefined();
            expect(cnssItem.amount).toBe(417.88); // (6000+200)*0.0674 for Jan payslip
        });

        it('GET /api/employees/:employeeId/payslips - should retrieve all payslips for Ahmed Bennani', async () => {
            // ahmedBennaniEmployeeId is from global beforeAll
            expect(ahmedBennaniEmployeeId).toBeDefined();

            const response = await request(API_BASE_URL)
                .get(`/api/employees/${ahmedBennaniEmployeeId}/payslips`);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            // Should now have 2 payslips (Jan and Feb) for Ahmed Bennani
            expect(response.body.length).toBe(2);

            // testPayslipId is Jan payslip
            const foundJanPayslip = response.body.find(p => p.id === testPayslipId);
            expect(foundJanPayslip).toBeDefined();
            expect(foundJanPayslip.grossPay).toBe(6200.00); // Jan payslip's grossPay

            // Check for Feb payslip details (optional, but good for completeness)
            const febPayslip = response.body.find(p => p.grossPay === 6300.00); // Feb grossPay
            expect(febPayslip).toBeDefined();
        });

        it('GET /api/payslips/:payslipId - should fail with 400 for invalid payslipId UUID format', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/payslips/invalid-uuid');
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toContain("Invalid payslip ID format");
        });

        it('GET /api/payslips/:payslipId - should fail with 404 if payslipId does not exist', async () => {
            const nonExistentUUID = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID, but non-existent
            const response = await request(API_BASE_URL)
                .get(`/api/payslips/${nonExistentUUID}`);
            expect(response.statusCode).toBe(404);
            expect(response.body.error).toContain("Payslip not found");
        });

        it('GET /api/employees/:employeeId/payslips - should fail with 400 for invalid employeeId UUID format', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/employees/invalid-uuid/payslips');
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toContain("Invalid employee ID format");
        });

        it('GET /api/employees/:employeeId/payslips - should return an empty array for a non-existent employeeId', async () => {
            const nonExistentUUID = '123e4567-e89b-12d3-a456-426614174001'; // Valid UUID, but non-existent
            const response = await request(API_BASE_URL)
                .get(`/api/employees/${nonExistentUUID}/payslips`);
            expect(response.statusCode).toBe(200); // Or 404 depending on desired API behavior, 200 with empty is common
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });
    });
});
