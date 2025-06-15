import request from 'supertest';
import app from '../server.js';
import prisma from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

describe('Salary Components API (Integration)', () => {
  let token, tenant;

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
    
    const jurisdiction = await prisma.jurisdiction.create({
      data: { id: 'MA_SALARY_COMP', name: 'Morocco Salary Comp', currency: 'MAD', locale: 'fr-MA' }
    });

    tenant = await prisma.Tenant.create({
      data: {
        name: 'Test Tenant Sal Comp',
        schemaName: `test_tenant_salary`,
        jurisdictionId: jurisdiction.id,
      },
    });

    const user = await prisma.User.create({ data: { email: 'salary.test@example.com', firstName: 'Sal', lastName: 'Comp', passwordHash: '...' }});
    const role = await prisma.Role.create({ data: { name: 'admin', tenantId: tenant.id }});
    await prisma.userTenantAccess.create({ data: { userId: user.id, tenantId: tenant.id, roleId: role.id }});

    const payload = { user: { id: user.id, tenantId: tenant.id, roleId: role.id }};
    token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  });
  
  describe('POST /api/salary-components', () => {
    it('should create a new fixed earning component', async () => {
        const componentData = {
            name: 'Test Fixed Earning',
            type: 'earning',
            calculationType: 'fixed',
            amount: 500,
            isTaxable: true,
        };
        const response = await request(app)
            .post('/api/salary-components')
            .set('x-auth-token', token)
            .send(componentData);
        
        expect(response.statusCode).toBe(201);
        expect(response.body.name).toBe('Test Fixed Earning');
    });
  });
});