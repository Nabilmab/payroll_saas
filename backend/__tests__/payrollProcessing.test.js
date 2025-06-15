import { processPayroll } from '../services/payrollEngine.js';
import prisma from '../lib/prisma.js';

describe('Payroll Processing Service (processPayroll) - DYNAMIC ENGINE', () => {
    let tenant, user, paySchedule, components = {}, employee1, moroccoJurisdiction;

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

        // Setup test data
        moroccoJurisdiction = await prisma.jurisdiction.create({
            data: { id: 'MA_TEST_PROC', name: 'Morocco Test Proc', currency: 'MAD', locale: 'fr-MA' }
        });

        tenant = await prisma.Tenant.create({ 
            data: { 
                name: 'Test Tenant Processing Inc.', 
                schemaName: 'test_tenant_processing_dyn',
                jurisdictionId: moroccoJurisdiction.id,
            } 
        });
        
        user = await prisma.user.create({ data: { email: 'payroll.admin.dyn@test.com', firstName: 'Admin', lastName: 'User', passwordHash: 'password' } });
        const role = await prisma.role.create({data: {name: 'admin', tenantId: tenant.id}});
        await prisma.userTenantAccess.create({ data: { userId: user.id, tenantId: tenant.id, roleId: role.id } });
        
        paySchedule = await prisma.PaySchedule.create({ data: { name: 'Monthly Schedule Dyn', frequency: 'monthly', tenantId: tenant.id } });

        components.baseSalary = await prisma.SalaryComponent.create({ data: { name: "Salaire de Base Test", type: "earning", calculationType: "fixed", isTaxable: true, tenantId: tenant.id } });
        components.transport = await prisma.SalaryComponent.create({ data: { name: "Indemnité de Transport Test", type: "earning", calculationType: "fixed", isTaxable: false, tenantId: tenant.id } });
        components.cnss = await prisma.SalaryComponent.create({ data: { name: 'CNSS Test', type: 'deduction', calculationType: 'formula', isSystemDefined: true, jurisdictionId: moroccoJurisdiction.id } });
        components.amo = await prisma.SalaryComponent.create({ data: { name: 'AMO Test', type: 'deduction', calculationType: 'formula', isSystemDefined: true, jurisdictionId: moroccoJurisdiction.id } });
        components.igr = await prisma.SalaryComponent.create({ data: { name: 'IGR Test', type: 'tax', calculationType: 'formula', isSystemDefined: true, jurisdictionId: moroccoJurisdiction.id } });

        // Add the missing calculation steps and tax brackets
        await prisma.calculationStep.createMany({
            data: [
                { jurisdictionId: moroccoJurisdiction.id, executionOrder: 10, name: 'Test Gross Pay', targetContextKey: 'grossPay', formula: 'SUM_EARNINGS', baseContextKeys: [] },
                { jurisdictionId: moroccoJurisdiction.id, executionOrder: 20, name: 'Test Taxable Pay', targetContextKey: 'taxablePay', formula: 'SUM_TAXABLE_EARNINGS', baseContextKeys: [] },
                { jurisdictionId: moroccoJurisdiction.id, executionOrder: 30, name: 'Test CNSS', targetContextKey: 'cnssAmount', targetComponentId: components.cnss.id, formula: 'MIN(taxablePay, 6000) * 0.0448', baseContextKeys: ['taxablePay'] },
                { jurisdictionId: moroccoJurisdiction.id, executionOrder: 40, name: 'Test AMO', targetContextKey: 'amoAmount', targetComponentId: components.amo.id, formula: 'taxablePay * 0.0226', baseContextKeys: ['taxablePay'] },
                { jurisdictionId: moroccoJurisdiction.id, executionOrder: 50, name: 'Test Annual Taxable', targetContextKey: 'netTaxableAnnual', formula: '(taxablePay - cnssAmount - amoAmount) * 12', baseContextKeys: ['taxablePay', 'cnssAmount', 'amoAmount'] },
                { jurisdictionId: moroccoJurisdiction.id, executionOrder: 60, name: 'Test IGR', targetContextKey: 'igrAmount', targetComponentId: components.igr.id, formula: 'CALCULATE_TAX(netTaxableAnnual) / 12', baseContextKeys: ['netTaxableAnnual'] },
                { jurisdictionId: moroccoJurisdiction.id, executionOrder: 70, name: 'Test Custom Deductions', targetContextKey: 'customDeductions', formula: 'SUM_CUSTOM_DEDUCTIONS', baseContextKeys: [] },
                { jurisdictionId: moroccoJurisdiction.id, executionOrder: 80, name: 'Test Total Deductions', targetContextKey: 'totalDeductions', formula: 'customDeductions', baseContextKeys: ['customDeductions'] },
                { jurisdictionId: moroccoJurisdiction.id, executionOrder: 90, name: 'Test Total Taxes', targetContextKey: 'totalTaxes', formula: 'cnssAmount + amoAmount + igrAmount', baseContextKeys: ['cnssAmount', 'amoAmount', 'igrAmount'] },
                { jurisdictionId: moroccoJurisdiction.id, executionOrder: 100, name: 'Test Net Pay', targetContextKey: 'netPay', formula: 'grossPay - totalDeductions - totalTaxes', baseContextKeys: ['grossPay', 'totalDeductions', 'totalTaxes'] },
            ]
        });
        await prisma.taxBracket.createMany({
            data: [
              { jurisdictionId: moroccoJurisdiction.id, year: 2024, incomeMin: 0, incomeMax: 30000, rate: 0.00, flatDeduction: 0 },
              { jurisdictionId: moroccoJurisdiction.id, year: 2024, incomeMin: 30001, incomeMax: 50000, rate: 0.10, flatDeduction: 3000 },
              { jurisdictionId: moroccoJurisdiction.id, year: 2024, incomeMin: 50001, incomeMax: 60000, rate: 0.20, flatDeduction: 8000 },
              { jurisdictionId: moroccoJurisdiction.id, year: 2024, incomeMin: 60001, incomeMax: 80000, rate: 0.30, flatDeduction: 14000 },
              { jurisdictionId: moroccoJurisdiction.id, year: 2024, incomeMin: 80001, incomeMax: 180000, rate: 0.34, flatDeduction: 17200 },
              { jurisdictionId: moroccoJurisdiction.id, year: 2024, incomeMin: 180001, incomeMax: null, rate: 0.38, flatDeduction: 24400 },
            ],
        });

        employee1 = await prisma.Employee.create({ 
          data: { 
            firstName: 'Ali', 
            lastName: 'Hassani Test', 
            email: 'ali.h.dyn@test.com', 
            jobTitle: 'Dynamic Processor',
            hireDate: new Date('2023-01-01'), 
            status: 'active', 
            tenantId: tenant.id 
          } 
        });
        
        const effectiveDate = new Date();
        await prisma.EmployeeSalarySetting.createMany({
            data: [
                { employeeId: employee1.id, salaryComponentId: components.baseSalary.id, amount: 12000, tenantId: tenant.id, effectiveDate },
                { employeeId: employee1.id, salaryComponentId: components.transport.id, amount: 500, tenantId: tenant.id, effectiveDate },
            ]
        });
    }, 30000); // Increase timeout for this heavy setup

    it('should correctly process payroll using the dynamic engine and store reasonable totals', async () => {
        const periodEndDate = new Date('2024-05-31');
        const paymentDate = new Date('2024-05-31');
        
        const { payrollRun } = await processPayroll(tenant.id, paySchedule.id, periodEndDate, paymentDate, user.id);

        expect(payrollRun).toBeDefined();
        expect(payrollRun.status).toBe('completed');
        expect(payrollRun.totalEmployees).toBe(1);
        expect(Number(payrollRun.totalGrossPay)).toBeCloseTo(12500);
    }, 20000);
});