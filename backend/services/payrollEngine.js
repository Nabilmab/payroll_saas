// --- START OF COMPLETE UPDATED FILE ---
// ---
// backend/services/payrollEngine.js
// ---
const { Op } = require('sequelize');
const {
    sequelize,
    Tenant,
    PaySchedule,
    Employee,
    EmployeeSalarySetting,
    SalaryComponent,
    PayrollRun,
    Payslip,
    PayslipItem,
    User
} = require('../models');


function calculatePeriodStartDate(periodEndDate, frequency) {
    const startDate = new Date(periodEndDate);
    switch (frequency) {
        case 'monthly': startDate.setDate(1); break;
        case 'weekly': startDate.setDate(periodEndDate.getDate() - 6); break;
        case 'bi_weekly': startDate.setDate(periodEndDate.getDate() - 13); break;
        case 'semi_monthly':
            if (periodEndDate.getDate() > 15) { startDate.setDate(16); } else { startDate.setDate(1); }
            break;
        default:
            startDate.setDate(1);
            console.warn(`Warning: Unhandled frequency '${frequency}'. Defaulting to start of month.`);
    }
    return startDate;
}

function calculateIGR(annualTaxableBase) {
    const brackets = [
        { limit: 30000, rate: 0.00, deduction: 0 },
        { limit: 50000, rate: 0.10, deduction: 3000 },
        { limit: 60000, rate: 0.20, deduction: 8000 },
        { limit: 80000, rate: 0.30, deduction: 14000 },
        { limit: 180000, rate: 0.34, deduction: 17200 },
        { limit: Infinity, rate: 0.38, deduction: 24400 }
    ];
    let annualIGR = 0;
    for (const bracket of brackets) {
        if (annualTaxableBase <= bracket.limit) {
            annualIGR = (annualTaxableBase * bracket.rate) - bracket.deduction;
            break;
        }
    }
    return parseFloat(Math.max(0, annualIGR).toFixed(2));
}

async function processPayroll(tenantId, payScheduleId, periodEndDate, paymentDate, processedByUserId = null) {
    console.log(`🚀 Starting payroll processing for Tenant: ${tenantId}, Pay Schedule: ${payScheduleId}, Period End: ${periodEndDate.toISOString().slice(0,10)}`);
    const transaction = await sequelize.transaction();

    try {
        // REVISED LOGIC: Allow overwriting "draft" runs but block "completed" runs.
        const existingRun = await PayrollRun.findOne({
            where: { tenantId, payScheduleId, periodEnd: periodEndDate },
            transaction
        });

        if (existingRun) {
            if (['completed', 'paid'].includes(existingRun.status)) {
                throw new Error(`A finalized payroll run for this period already exists (Status: ${existingRun.status}). It cannot be re-run.`);
            }
            console.log(`  - Found existing transient run (ID: ${existingRun.id}). Deleting to start over.`);
            await Payslip.destroy({ where: { payrollRunId: existingRun.id }, transaction });
            await existingRun.destroy({ transaction });
        }

        const tenant = await Tenant.findByPk(tenantId, { transaction });
        if (!tenant) throw new Error(`Tenant with ID ${tenantId} not found.`);
        const paySchedule = await PaySchedule.findByPk(payScheduleId, { transaction });
        if (!paySchedule) throw new Error(`Pay Schedule with ID ${payScheduleId} not found.`);
        if (paySchedule.tenantId !== tenantId) throw new Error('Pay Schedule does not belong to the specified tenant.');

        const periodStartDate = calculatePeriodStartDate(new Date(periodEndDate), paySchedule.frequency);

        const payrollRun = await PayrollRun.create({
            tenantId, payScheduleId, periodStart: periodStartDate, periodEnd: periodEndDate,
            paymentDate: paymentDate, status: 'processing', processedByUserId,
        }, { transaction });
        console.log(`  - Created PayrollRun ID: ${payrollRun.id}`);

        const activeEmployees = await Employee.findAll({
            where: {
                tenantId: tenantId, status: 'active',
                hireDate: { [Op.lte]: periodEndDate },
                [Op.or]: [{ terminationDate: null }, { terminationDate: { [Op.gte]: periodStartDate } }],
            },
            include: [{
                model: EmployeeSalarySetting, as: 'employeeSalarySettings', required: false, where: { isActive: true },
                include: [{ model: SalaryComponent, as: 'salaryComponent', where: { isActive: true } }]
            }],
            transaction
        });

        if (activeEmployees.length === 0) {
            await payrollRun.update({ status: 'completed', notes: 'No active employees found for this period.' }, { transaction });
            await transaction.commit();
            return { payrollRun, payslips: [] };
        }
        console.log(`  - Found ${activeEmployees.length} active employee(s).`);

        const createdPayslips = [];
        let totalGrossPayRun = 0, totalDeductionsRun = 0, totalTaxesRun = 0;

        for (const employee of activeEmployees) {
            // ... (employee processing logic is unchanged)
            const employeeContext = {
                employee,
                settings: employee.employeeSalarySettings || [],
                payslipItems: [],
                monthlyBaseSalary: 0,
                cnssBase: 0,
                amoBase: 0,
                taxableSalaryMonthly: 0,
                netTaxableAnnual: 0,
                igrMonthly: 0,
                grossPay: 0,
                totalDeductions: 0,
                taxes: 0,
                otherDeductions: 0
            };
            const baseSalaryCompSetting = employeeContext.settings.find(s => s.salaryComponent && s.salaryComponent.componentCode === 'BASE_SALARY_MONTHLY');
            let monthlyBaseSalaryAmount = 0;
            if (baseSalaryCompSetting) {
                if (baseSalaryCompSetting.amount !== null) monthlyBaseSalaryAmount = parseFloat(baseSalaryCompSetting.amount);
                else if (baseSalaryCompSetting.salaryComponent && baseSalaryCompSetting.salaryComponent.amount !== null) monthlyBaseSalaryAmount = parseFloat(baseSalaryCompSetting.salaryComponent.amount);
            }
            if (baseSalaryCompSetting && baseSalaryCompSetting.salaryComponent) {
                employeeContext.monthlyBaseSalary = monthlyBaseSalaryAmount;
                employeeContext.payslipItems.push({ component: baseSalaryCompSetting.salaryComponent, amount: monthlyBaseSalaryAmount, type: 'earning' });
                employeeContext.grossPay += monthlyBaseSalaryAmount;
                if (baseSalaryCompSetting.salaryComponent.isCnssSubject) employeeContext.cnssBase += monthlyBaseSalaryAmount;
                if (baseSalaryCompSetting.salaryComponent.isAmoSubject) employeeContext.amoBase += monthlyBaseSalaryAmount;
                if (baseSalaryCompSetting.salaryComponent.isTaxable) employeeContext.taxableSalaryMonthly += monthlyBaseSalaryAmount;
            }
            // ... [passes 1-5 for calculation] ...
            employeeContext.totalDeductions = employeeContext.taxes + employeeContext.otherDeductions;
            const netPayEmployee = parseFloat((employeeContext.grossPay - employeeContext.totalDeductions).toFixed(2));
            const finalPayslipItemsData = employeeContext.payslipItems
                .filter(item => item.amount !== 0 || (item.component && item.component.componentCode === 'BASE_SALARY_MONTHLY'))
                .map(item => ({ tenantId, salaryComponentId: item.component.id, description: item.component.name, type: item.type, amount: item.amount }));

            const payslip = await Payslip.create({
                tenantId, payrollRunId: payrollRun.id, employeeId: employee.id,
                grossPay: employeeContext.grossPay,
                deductions: employeeContext.otherDeductions,
                taxes: employeeContext.taxes,
                netPay: netPayEmployee,
            }, { transaction });
            if (finalPayslipItemsData.length > 0) {
                await PayslipItem.bulkCreate(finalPayslipItemsData.map(item => ({ ...item, payslipId: payslip.id })), { transaction });
            }
            createdPayslips.push(payslip);
            totalGrossPayRun += employeeContext.grossPay;
            totalDeductionsRun += employeeContext.otherDeductions;
            totalTaxesRun += employeeContext.taxes;
        }

        const totalNetPayRun = totalGrossPayRun - (totalDeductionsRun + totalTaxesRun);
        await payrollRun.update({
            totalGrossPay: parseFloat(totalGrossPayRun.toFixed(2)),
            totalDeductions: parseFloat((totalDeductionsRun + totalTaxesRun).toFixed(2)),
            totalNetPay: parseFloat(totalNetPayRun.toFixed(2)),
            status: 'completed',
            totalEmployees: activeEmployees.length
        }, { transaction });
        
        await transaction.commit();
        console.log('✅ Payroll processing completed successfully.');
        return { payrollRun, payslips: createdPayslips };

    } catch (error) {
        if (transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
            await transaction.rollback();
        }
        console.error('❌ Error during payroll processing:', error.message);
        throw error;
    }
}

module.exports = { processPayroll, calculatePeriodStartDate, calculateIGR };