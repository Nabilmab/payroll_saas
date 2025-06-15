import request from 'supertest';
import app from '../server.js';
import prisma from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

describe('Payroll SaaS API Integration Tests (Prisma)', () => {
  let token, techSolutionsTenant, ahmedBennani, baseSalaryComponent, itDepartment, testUser;

  beforeAll(async () => {
    // Robust cleanup order
    await prisma.PayslipItem.deleteMany({});
    await prisma.Payslip.deleteMany({});
    await prisma.PayrollRun.deleteMany({});
    await prisma.EmployeeSalarySetting.deleteMany({});
    await prisma.Employee.deleteMany({});
    await prisma.userTenantAccess.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.Department.deleteMany({});
    await prisma.CalculationStep.deleteMany({});
    await prisma.TaxBracket.deleteMany({});
    await prisma.SalaryComponent.deleteMany({});
    await prisma.PaySchedule.deleteMany({});
    await prisma.Role.deleteMany({});
    await prisma.Tenant.deleteMany({});
    await prisma.Jurisdiction.deleteMany({});

    // Create test-specific data
    const jurisdiction = await prisma.jurisdiction.create({
      data: { id: 'MA_API', name: 'Morocco API Test', currency: 'MAD', locale: 'fr-MA' }
    });

    techSolutionsTenant = await prisma.Tenant.create({
      data: {
        name: "TechSolutions SARL Test API",
        schemaName: "techsolutions_test_api_integration",
        jurisdictionId: jurisdiction.id,
      }
    });
    
    testUser = await prisma.user.create({
        data: {
            email: 'api.test.manager@company.com',
            firstName: 'API', lastName: 'Tester', passwordHash: 'password'
        }
    });
    const role = await prisma.role.create({data: {name: 'admin', tenantId: techSolutionsTenant.id}});
    await prisma.userTenantAccess.create({
        data: { userId: testUser.id, tenantId: techSolutionsTenant.id, roleId: role.id }
    });

    const payload = { 
        user: { 
            id: testUser.id, 
            tenantId: techSolutionsTenant.id,
            roleId: role.id,
            roleName: role.name
        } 
    };
    token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    itDepartment = await prisma.Department.create({
      data: { name: "Information Technology API", tenantId: techSolutionsTenant.id }
    });
    baseSalaryComponent = await prisma.SalaryComponent.create({
      data: {
        name: 'API Test Base Salary', type: 'earning', calculationType: 'fixed',
        tenantId: techSolutionsTenant.id,
      }
    });
    ahmedBennani = await prisma.Employee.create({
      data: {
        firstName: 'Ahmed', lastName: 'Bennani API', email: 'ahmed.bennani.api.test@company.com',
        jobTitle: 'Software Engineer', hireDate: new Date(),
        departmentId: itDepartment.id, tenantId: techSolutionsTenant.id,
      }
    });
  });

  it('POST /api/employees/:employeeId/salary-settings should succeed with a valid token', async () => {
    const payload = {
        salaryComponentId: baseSalaryComponent.id,
        effectiveDate: new Date().toISOString(),
        amount: 50000
    };
    const response = await request(app)
      .post(`/api/employees/${ahmedBennani.id}/salary-settings`)
      .set('x-auth-token', token)
      .send(payload);

    expect(response.statusCode).toBe(201);
  });
});