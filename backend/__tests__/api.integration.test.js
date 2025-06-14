// backend/__tests__/api.integration.test.js
import request from 'supertest';
import app from '../server.js';
import prisma from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

describe('Payroll SaaS API Integration Tests (Prisma)', () => {
  let token;
  let techSolutionsTenant;
  let ahmedBennani;
  let baseSalaryComponent;
  let itDepartment;

  beforeAll(async () => {
    // ✅ FIX: Comprehensive cleanup in the correct order to avoid foreign key errors.
    // Delete from tables that reference others first.
    await prisma.PayslipItem.deleteMany({});
    await prisma.Payslip.deleteMany({});
    await prisma.PayrollRun.deleteMany({});
    await prisma.EmployeeSalarySetting.deleteMany({});
    await prisma.Employee.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.Department.deleteMany({});
    await prisma.SalaryComponent.deleteMany({});
    await prisma.PaySchedule.deleteMany({});
    await prisma.Tenant.deleteMany({});

    techSolutionsTenant = await prisma.Tenant.create({
      data: { name: "TechSolutions SARL Test API", schemaName: "techsolutions_test_api_integration" }
    });

    const testUser = await prisma.user.create({
        data: {
            email: 'api.test.manager@company.com',
            firstName: 'API',
            lastName: 'Tester',
            passwordHash: 'password',
            tenantId: techSolutionsTenant.id,
        }
    });

    const payload = { user: { id: testUser.id, tenantId: testUser.tenantId } };
    token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    itDepartment = await prisma.Department.create({
      data: { name: "Information Technology API", tenantId: techSolutionsTenant.id }
    });
    baseSalaryComponent = await prisma.SalaryComponent.create({
      data: {
        name: 'API Test Base Salary',
        type: 'earning',
        calculationType: 'fixed',
        tenantId: techSolutionsTenant.id,
      }
    });
    ahmedBennani = await prisma.Employee.create({
      data: {
        firstName: 'Ahmed',
        lastName: 'Bennani API',
        email: 'ahmed.bennani.api.test@company.com',
        jobTitle: 'Software Engineer',
        hireDate: new Date(),
        departmentId: itDepartment.id,
        tenantId: techSolutionsTenant.id,
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