// backend/__tests__/payrollProcessing.test.js

import { processPayroll, calculateIGR } from '../services/payrollEngine.js';
import prisma from '../lib/prisma.js';

describe('Payroll Processing Service (processPayroll)', () => {
    let tenant;
    let user;
    let paySchedule;
    let components = {};
    let employee1;

    beforeAll(async () => {
        // ... (beforeAll setup is correct)
        await prisma.PayslipItem.deleteMany({});
        await prisma.Payslip.deleteMany({});
        await prisma.PayrollRun.deleteMany({});
        await prisma.EmployeeSalarySetting.deleteMany({});
        await prisma.Employee.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.SalaryComponent.deleteMany({});
        await prisma.PaySchedule.deleteMany({});
        await prisma.Tenant.deleteMany({});

        tenant = await prisma.Tenant.create({ data: { name: 'Test Tenant Inc.', schemaName: 'test_tenant_processing' } });
        user = await prisma.user.create({ data: { email: 'payroll.admin@test.com', firstName: 'Admin', lastName: 'User', passwordHash: 'password', tenantId: tenant.id } });
        paySchedule = await prisma.PaySchedule.create({ data: { name: 'Monthly Schedule', frequency: 'monthly', tenantId: tenant.id } });

        const baseSalary = await prisma.SalaryComponent.create({ data: { name: "Salaire de Base", type: "earning", calculationType: "fixed", isTaxable: true, tenantId: tenant.id } });
        const transport = await prisma.SalaryComponent.create({ data: { name: "Indemnité de Transport", type: "earning", calculationType: "fixed", isTaxable: false, tenantId: tenant.id } });
        components = { baseSalary, transport };

        employee1 = await prisma.Employee.create({ data: { firstName: 'Ali', lastName: 'Hassani', email: 'ali.h@test.com', hireDate: new Date('2023-01-01'), status: 'active', tenantId: tenant.id } });
        
        const effectiveDate = new Date();
        await prisma.EmployeeSalarySetting.createMany({
            data: [
                { employeeId: employee1.id, salaryComponentId: components.baseSalary.id, amount: 12000, tenantId: tenant.id, effectiveDate },
                { employeeId: employee1.id, salaryComponentId: components.transport.id, amount: 500, tenantId: tenant.id, effectiveDate },
            ]
        });
    });

    it('should correctly process payroll and store reasonable totals', async () => {
        const periodEndDate = new Date('2024-05-31');
        const paymentDate = new Date('2024-05-31');
        
        const { payrollRun } = await processPayroll(tenant.id, paySchedule.id, periodEndDate, paymentDate, user.id);

        expect(payrollRun).toBeDefined();
        expect(payrollRun.status).toBe('completed');
        expect(payrollRun.totalEmployees).toBe(1);

        // ✅ FIX: Coerce the Decimal object from Prisma to a Number before asserting.
        expect(Number(payrollRun.totalGrossPay)).toBeLessThan(100000);
        expect(Number(payrollRun.totalGrossPay)).toBeCloseTo(12500);
    }, 20000);
});