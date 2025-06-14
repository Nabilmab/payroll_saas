// --- START OF NEW FILE ---
// ---
// backend/__tests__/payrollProcessing.test.js
// ---
const { processPayroll } = require('../services/payrollEngine');
const { sequelize, Tenant, User, PaySchedule, Employee, SalaryComponent, EmployeeSalarySetting, PayrollRun, Payslip, PayslipItem } = require('../models');

describe('Payroll Processing Service (processPayroll)', () => {
    let tenant;
    let user;
    let paySchedule;
    let components = {};
    let employee1, employee2;

    // Setup a clean database and seed with necessary data before all tests run
    beforeAll(async () => {
        await sequelize.sync({ force: true });

        // 1. Create Tenant, User, and Pay Schedule
        tenant = await Tenant.create({ name: 'Test Tenant Inc.', schemaName: 'test_tenant' });
        user = await User.create({ tenantId: tenant.id, email: 'payroll.admin@test.com', firstName: 'Admin', lastName: 'User', passwordHash: 'password' });
        paySchedule = await PaySchedule.create({ tenantId: tenant.id, name: 'Monthly Schedule', frequency: 'monthly' });

        // 2. Create standard Salary Components
        const componentsData = [
            { name: "Salaire de Base", type: "earning", calculationType: "fixed", is_taxable: true, isCnssSubject: true, isAmoSubject: true, componentCode: 'BASE_SALARY_MONTHLY', payslipDisplayOrder: 1 },
            { name: "Indemnité de Transport", type: "earning", calculationType: "fixed", is_taxable: false, isCnssSubject: false, isAmoSubject: false, componentCode: 'TRANSPORT_ALLOWANCE', payslipDisplayOrder: 10 },
            { name: "Prime de Ventes", type: "earning", calculationType: "percentage", is_taxable: true, isCnssSubject: true, isAmoSubject: true, componentCode: 'SALES_COMMISSION', payslipDisplayOrder: 5 },
            { name: "Prime d'Ancienneté", type: "earning", calculationType: "formula", is_taxable: true, isCnssSubject: true, isAmoSubject: true, componentCode: 'SENIORITY_BONUS', payslipDisplayOrder: 2 },
            { name: "Remboursement de Prêt", type: "deduction", calculationType: "fixed", componentCode: 'LOAN_REPAYMENT', payslipDisplayOrder: 200 },
            { name: "CNSS", type: "deduction", calculationType: "percentage", percentage: 4.48, is_system_defined: true, componentCode: 'CNSS_EMPLOYEE', payslipDisplayOrder: 100 }, // Employee part is 4.48% (from 6.74% total)
            { name: "AMO", type: "deduction", calculationType: "percentage", percentage: 2.26, is_system_defined: true, componentCode: 'AMO_EMPLOYEE', payslipDisplayOrder: 101 },
            { name: "IGR", type: "tax", calculationType: "formula", is_system_defined: true, componentCode: 'IGR_MONTHLY', payslipDisplayOrder: 102 }
        ];
        for (const data of componentsData) {
            const component = await SalaryComponent.create({ ...data, tenantId: tenant.id });
            components[data.componentCode] = component;
        }

        // 3. Create Employees
        employee1 = await Employee.create({ tenantId: tenant.id, firstName: 'Ali', lastName: 'Hassani', email: 'ali.h@test.com', hireDate: '2023-01-01', status: 'active' });
        employee2 = await Employee.create({ tenantId: tenant.id, firstName: 'Fatima', lastName: 'Bennani', email: 'fatima.b@test.com', hireDate: '2018-05-10', status: 'active' }); // 5+ years seniority

        // 4. Assign Salary Settings
        // Employee 1 (Simple Case)
        await EmployeeSalarySetting.bulkCreate([
            { tenantId: tenant.id, employeeId: employee1.id, salaryComponentId: components.BASE_SALARY_MONTHLY.id, amount: 8000 },
            { tenantId: tenant.id, employeeId: employee1.id, salaryComponentId: components.TRANSPORT_ALLOWANCE.id, amount: 400 },
            { tenantId: tenant.id, employeeId: employee1.id, salaryComponentId: components.CNSS_EMPLOYEE.id },
            { tenantId: tenant.id, employeeId: employee1.id, salaryComponentId: components.AMO_EMPLOYEE.id },
            { tenantId: tenant.id, employeeId: employee1.id, salaryComponentId: components.IGR_MONTHLY.id },
        ]);

        // Employee 2 (Complex Case)
        await EmployeeSalarySetting.bulkCreate([
            { tenantId: tenant.id, employeeId: employee2.id, salaryComponentId: components.BASE_SALARY_MONTHLY.id, amount: 20000 },
            { tenantId: tenant.id, employeeId: employee2.id, salaryComponentId: components.SALES_COMMISSION.id, percentage: 5 }, // 5% of base
            { tenantId: tenant.id, employeeId: employee2.id, salaryComponentId: components.SENIORITY_BONUS.id }, // Formula-based (5% for 5+ years)
            { tenantId: tenant.id, employeeId: employee2.id, salaryComponentId: components.LOAN_REPAYMENT.id, amount: 1500 },
            { tenantId: tenant.id, employeeId: employee2.id, salaryComponentId: components.CNSS_EMPLOYEE.id },
            { tenantId: tenant.id, employeeId: employee2.id, salaryComponentId: components.AMO_EMPLOYEE.id },
            { tenantId: tenant.id, employeeId: employee2.id, salaryComponentId: components.IGR_MONTHLY.id },
        ]);
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should correctly process payroll for multiple employees with different complexities', async () => {
        const periodEndDate = new Date('2024-05-31');
        const paymentDate = new Date('2024-05-31');

        const { payrollRun, payslips } = await processPayroll(tenant.id, paySchedule.id, periodEndDate, paymentDate, user.id);

        // --- General Assertions ---
        expect(payrollRun).toBeDefined();
        expect(payrollRun.status).toBe('completed');
        expect(payrollRun.totalEmployees).toBe(2);
        expect(payslips.length).toBe(2);

        // --- Assertions for Employee 1 (Ali Hassani - Simple Case) ---
        const payslip1 = await Payslip.findOne({ where: { employeeId: employee1.id }, include: [PayslipItem] });
        const items1 = payslip1.payslipItems.reduce((acc, item) => ({ ...acc, [item.description]: parseFloat(item.amount) }), {});

        // Calculations for Ali (Base=8000, Transport=400)
        // Gross Pay = 8000 (Transport is non-taxable, so not included in taxable base but is in net pay logic)
        // Note: The engine adds all earnings to grossPay. This is standard.
        // Gross Pay = 8000 + 400 = 8400
        const grossPay1 = 8000 + 400; 
        // CNSS Base = 8000 (capped at 6000). CNSS = 6000 * 4.48% = 268.80
        const cnss1 = 268.80;
        // AMO Base = 8000. AMO = 8000 * 2.26% = 180.80
        const amo1 = 180.80;
        // Taxable Salary = 8000. Net Taxable = 8000 - 268.80 - 180.80 = 7550.40
        // Professional Fees = 7550.40 * 20% = 1510.08
        // Final Taxable = 7550.40 - 1510.08 = 6040.32. Annual = 72483.84
        // IGR = (72483.84 * 0.30) - 14000 = 7745.15 (annual) -> 645.43 (monthly)
        const igr1 = 645.43;
        const totalTaxes1 = cnss1 + amo1 + igr1; // 1095.03
        const netPay1 = grossPay1 - totalTaxes1; // 8400 - 1095.03 = 7304.97

        expect(parseFloat(payslip1.grossPay)).toBeCloseTo(grossPay1, 2);
        expect(parseFloat(payslip1.taxes)).toBeCloseTo(totalTaxes1, 2);
        expect(parseFloat(payslip1.deductions)).toBe(0); // No custom deductions
        expect(parseFloat(payslip1.netPay)).toBeCloseTo(netPay1, 2);
        expect(items1['Salaire de Base']).toBe(8000);
        expect(items1['Indemnité de Transport']).toBe(400);
        expect(items1['CNSS']).toBeCloseTo(cnss1, 2);
        expect(items1['AMO']).toBeCloseTo(amo1, 2);
        expect(items1['IGR']).toBeCloseTo(igr1, 2);

        // --- Assertions for Employee 2 (Fatima Bennani - Complex Case) ---
        const payslip2 = await Payslip.findOne({ where: { employeeId: employee2.id }, include: [PayslipItem] });
        const items2 = payslip2.payslipItems.reduce((acc, item) => ({ ...acc, [item.description]: parseFloat(item.amount) }), {});

        // Calculations for Fatima (Base=20000, Commission=5%, Seniority=5+ years, Loan=1500)
        // Seniority Bonus = 20000 * 10% = 2000 (Over 5 years is 10%)
        const seniority2 = 2000;
        // Sales Commission = 20000 * 5% = 1000
        const commission2 = 1000;
        // Gross Pay = 20000 + 2000 + 1000 = 23000
        const grossPay2 = 23000;
        // CNSS Base = 23000 (capped at 6000). CNSS = 6000 * 4.48% = 268.80
        const cnss2 = 268.80;
        // AMO Base = 23000. AMO = 23000 * 2.26% = 519.80
        const amo2 = 519.80;
        // Taxable Salary = 23000. Net Taxable = 23000 - 268.80 - 519.80 = 22211.40
        // Professional Fees = 22211.40 * 20% = 4442.28 (capped at 2500)
        const profFees2 = 2500;
        // Final Taxable = 22211.40 - 2500 = 19711.40. Annual = 236536.8
        // IGR = (236536.8 * 0.38) - 24400 = 65483.98 (annual) -> 5456.99 (monthly)
        const igr2 = 5457.00; // Rounded
        const totalTaxes2 = cnss2 + amo2 + igr2; // 268.80 + 519.80 + 5457.00 = 6245.60
        const loanDeduction2 = 1500;
        const netPay2 = grossPay2 - totalTaxes2 - loanDeduction2; // 23000 - 6245.60 - 1500 = 15254.40

        expect(parseFloat(payslip2.grossPay)).toBeCloseTo(grossPay2, 2);
        expect(parseFloat(payslip2.taxes)).toBeCloseTo(totalTaxes2, 2);
        expect(parseFloat(payslip2.deductions)).toBeCloseTo(loanDeduction2, 2);
        expect(parseFloat(payslip2.netPay)).toBeCloseTo(netPay2, 2);
        expect(items2['Salaire de Base']).toBe(20000);
        expect(items2["Prime d'Ancienneté"]).toBeCloseTo(seniority2, 2);
        expect(items2['Prime de Ventes']).toBeCloseTo(commission2, 2);
        expect(items2['Remboursement de Prêt']).toBeCloseTo(loanDeduction2, 2);
        expect(items2['CNSS']).toBeCloseTo(cnss2, 2);
        expect(items2['AMO']).toBeCloseTo(amo2, 2);
        expect(items2['IGR']).toBeCloseTo(igr2, 2);

        // --- Final Payroll Run Totals Assertion ---
        expect(parseFloat(payrollRun.totalGrossPay)).toBeCloseTo(grossPay1 + grossPay2, 2);
        const totalRunDeductions = totalTaxes1 + totalTaxes2 + loanDeduction2;
        expect(parseFloat(payrollRun.totalDeductions)).toBeCloseTo(totalRunDeductions, 2);
        expect(parseFloat(payrollRun.totalNetPay)).toBeCloseTo(netPay1 + netPay2, 2);
    });
});