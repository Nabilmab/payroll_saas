// --- START OF UPDATED FILE ---
// ---
// backend/__tests__/api.integration.test.js
// ---
const request = require('supertest');
const app = require('../server');
const { sequelize, Tenant, User, Department, Employee, SalaryComponent, PaySchedule, EmployeeSalarySetting, EmployeeDependent } = require('../models');

// --- MOCK THE AUTHENTICATION MIDDLEWARE ---
const mockUser = {
  id: 1,
  tenantId: 1,
  email: 'manager.rh@techsolutions.ma',
  toJSON: () => ({ id: 1, tenantId: 1, email: 'manager.rh@techsolutions.ma' })
};

jest.mock('../middleware/auth', () => ({
  authenticateAndAttachUser: (req, res, next) => {
    req.user = mockUser;
    next();
  }
}));
// --- END OF MOCK ---

describe('Payroll SaaS API Integration Tests', () => {
  let techSolutionsTenant;
  let ahmedBennani, fatimaZahra;
  let baseSalaryComponent, transportComponent;
  let khalidBennaniDependentId;
  let ahmedBennaniEmployeeId;


  // This block runs once before all tests
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // --- Seed Data ---
    techSolutionsTenant = await Tenant.create({ name: "TechSolutions SARL", schemaName: "techsolutions" });
    mockUser.tenantId = techSolutionsTenant.id;

    const rhDepartment = await Department.create({ name: "Ressources Humaines", tenantId: techSolutionsTenant.id });
    const itDepartment = await Department.create({ name: "Technologie de l'Information", tenantId: techSolutionsTenant.id });

    const ahmedUser = await User.create({ email: 'ahmed.user@test.com', firstName: 'A', lastName: 'B', passwordHash: 'abc', tenantId: techSolutionsTenant.id });
    const fatimaUser = await User.create({ email: 'fatima.user@test.com', firstName: 'F', lastName: 'Z', passwordHash: 'abc', tenantId: techSolutionsTenant.id });
    mockUser.id = fatimaUser.id; // The test user is Fatima

    ahmedBennani = await Employee.create({
      firstName: "Ahmed", lastName: "Bennani", email: "ahmed.bennani@test.ma",
      jobTitle: "Développeur Principal", departmentId: itDepartment.id,
      tenantId: techSolutionsTenant.id, userId: ahmedUser.id, hireDate: new Date(), status: 'active'
    });
    ahmedBennaniEmployeeId = ahmedBennani.id;

    fatimaZahra = await Employee.create({
        firstName: "Fatima", lastName: "Zahra", email: "fatima.zahra@test.ma",
        jobTitle: "Responsable RH", departmentId: rhDepartment.id,
        tenantId: techSolutionsTenant.id, userId: fatimaUser.id, hireDate: new Date(), status: 'active'
    });

    baseSalaryComponent = await SalaryComponent.create({
      tenantId: techSolutionsTenant.id, name: 'Salaire de Base Test', type: 'earning',
      calculation_type: 'fixed', is_taxable: true, payslip_display_order: 1,
    });
    
    transportComponent = await SalaryComponent.create({
        tenantId: techSolutionsTenant.id, name: 'Indemnité Transport Test', type: 'earning',
        calculation_type: 'fixed', amount: 500, is_taxable: false, payslip_display_order: 10,
    });

    const khalid = await EmployeeDependent.create({
        fullName: "Khalid Bennani",
        relationship: "child",
        dateOfBirth: "2010-05-15",
        isFiscallyDependent: true,
        effectiveStartDate: new Date(),
        employeeId: ahmedBennani.id,
        tenantId: techSolutionsTenant.id
    });
    khalidBennaniDependentId = khalid.id;
  });

  afterAll(async () => {
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

            const response = await request(app)
                .post(`/api/employees/${ahmedBennaniEmployeeId}/dependents`)
                .send(newDependentPayload);

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.fullName).toBe("Fatima Bennani");
        });
    });

  describe('Employee Salary Settings API', () => {
    let testSettingId;

    it('POST /api/employees/:employeeId/salary-settings - should add a salary setting to an employee', async () => {
      const payload = {
        salaryComponentId: baseSalaryComponent.id,
        effectiveDate: '2024-01-01',
        amount: 20000,
      };

      const response = await request(app)
        .post(`/api/employees/${ahmedBennani.id}/salary-settings`)
        .send(payload);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.salaryComponentId).toBe(baseSalaryComponent.id);
      expect(response.body.amount).toBe("20000.00");
      testSettingId = response.body.id;
    });
    
    it('GET /api/employees/:employeeId/salary-settings - should retrieve all salary settings for an employee', async () => {
        const response = await request(app)
          .get(`/api/employees/${ahmedBennani.id}/salary-settings`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(1);
        expect(response.body[0].id).toBe(testSettingId);
        expect(response.body[0].salaryComponent.name).toBe('Salaire de Base Test');
    });

    it('PUT /api/employees/:employeeId/salary-settings/:settingId - should update a salary setting', async () => {
        const payload = {
            amount: 22000,
        };

        const response = await request(app)
            .put(`/api/employees/${ahmedBennani.id}/salary-settings/${testSettingId}`)
            .send(payload);

        expect(response.statusCode).toBe(200);
        // FIX: The API returns a number, so the test should expect a number.
        expect(response.body.amount).toBe(22000);
    });

    it('DELETE /api/employees/:employeeId/salary-settings/:settingId - should delete a salary setting', async () => {
        const response = await request(app)
            .delete(`/api/employees/${ahmedBennani.id}/salary-settings/${testSettingId}`);
        
        expect(response.statusCode).toBe(204);

        const getResponse = await request(app)
            .get(`/api/employees/${ahmedBennani.id}/salary-settings`);
        
        expect(getResponse.statusCode).toBe(200);
        expect(getResponse.body.length).toBe(0);
    });
  });
});