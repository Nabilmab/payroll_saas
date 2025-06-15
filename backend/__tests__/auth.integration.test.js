import request from 'supertest';
import app from '../server.js';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

describe('Authentication API (/api/auth)', () => {
  let userId, tenant1Id, tenant2Id;

  beforeAll(async () => {
    // A robust cleanup
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

    const morocco = await prisma.jurisdiction.create({
      data: { id: 'MA_AUTH', name: 'Morocco Auth Test', currency: 'MAD', locale: 'fr-MA' },
    });
    const senegal = await prisma.jurisdiction.create({
      data: { id: 'SN_AUTH', name: 'Senegal Auth Test', currency: 'XOF', locale: 'fr-SN' },
    });

    const tenant1 = await prisma.tenant.create({
      data: { name: 'TechSolutions SARL', schemaName: 'tech_auth', jurisdictionId: morocco.id },
    });
    const tenant2 = await prisma.tenant.create({
      data: { name: 'DakarInnov SUARL', schemaName: 'dakar_auth', jurisdictionId: senegal.id },
    });
    tenant1Id = tenant1.id;
    tenant2Id = tenant2.id;

    const adminRoleMA = await prisma.role.create({ data: { name: 'admin', tenantId: tenant1.id } });
    const adminRoleSN = await prisma.role.create({ data: { name: 'admin', tenantId: tenant2.id } });

    const user = await prisma.user.create({
      data: {
        email: 'multi.tenant.admin@example.com',
        firstName: 'Youssef',
        lastName: 'Alaoui',
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });
    userId = user.id;

    await prisma.userTenantAccess.createMany({
      data: [
        { userId: user.id, tenantId: tenant1.id, roleId: adminRoleMA.id },
        { userId: user.id, tenantId: tenant2.id, roleId: adminRoleSN.id },
      ],
    });
  });

  describe('POST /api/auth/login', () => {
    it('should succeed with correct credentials and return a user profile and a list of 2 tenants', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'multi.tenant.admin@example.com', password: 'password123' });

      expect(response.statusCode).toBe(200);
      expect(response.body.user.id).toBe(userId);
      expect(response.body.tenants).toHaveLength(2);
      expect(response.body.tenants.map(t => t.name)).toContain('TechSolutions SARL');
    });
  });

  describe('POST /api/auth/select-tenant', () => {
    it('should succeed and return a JWT for a valid tenant selection', async () => {
      const response = await request(app)
        .post('/api/auth/select-tenant')
        .send({ userId: userId, tenantId: tenant1Id });

      expect(response.statusCode).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.tenant.id).toBe(tenant1Id);
      expect(response.body.user.tenant.name).toBe('TechSolutions SARL');
    });
  });
});