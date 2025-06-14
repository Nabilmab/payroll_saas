// --- START OF COMPLETE UPDATED FILE ---
// ---
// backend/services/payrollEngine.js
// ---
const { Op } = require('sequelize');
const {
    sequelize,
    Employee,
    EmployeeSalarySetting,
    SalaryComponent,
    PayrollRun,
    Payslip,
    PayslipItem,
} = require('../models');

/**
 * Calculates the start date of a pay period based on its end date and frequency.
 * @param {Date} periodEndDate - The end date of the period.
 * @param {string} frequency - The frequency of the pay schedule (e.g., 'monthly').
 * @returns {Date} The calculated start date of the period.
 */
function calculatePeriodStartDate(periodEndDate, frequency) {
    const startDate = new Date(periodEndDate);
    switch (frequency) {
        case 'monthly':
            startDate.setDate(1);
            break;
        case 'weekly':
            startDate.setDate(periodEndDate.getDate() - 6);
            break;
        case 'bi_weekly':
            startDate.setDate(periodEndDate.getDate() - 13);
            break;
        case 'semi_monthly':
            if (periodEndDate.getDate() > 15) {
                startDate.setDate(16);
            } else {
                startDate.setDate(1);
            }
            break;
        default:
            startDate.setDate(1);
            console.warn(`Warning: Unhandled frequency '${frequency}'. Defaulting to start of month.`);
    }
    return startDate;
}

/**
 * Calculates Moroccan Income Tax (IGR) for 2024 based on annual taxable income.
 * @param {number} annualTaxableBase - The total annual taxable income.
 * @returns {number} The calculated annual IGR amount.
 */
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

/**
 * Main payroll processing function. Creates a payroll run and generates payslips for all eligible employees.
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} payScheduleId - The ID of the pay schedule for the run.
 * @param {Date} periodEndDate - The end date of the pay period.
 * @param {Date} paymentDate - The date of payment for this run.
 * @param {string} processedByUserId - The ID of the user initiating the run.
 * @returns {Promise<{payrollRun: PayrollRun, payslips: Payslip[]}>} The created payroll run and payslips.
 */
async function processPayroll(tenantId, payScheduleId, periodEndDate, paymentDate, processedByUserId = null) {
    console.log(`🚀 Starting payroll processing for Tenant: ${tenantId}, Pay Schedule: ${payScheduleId}, Period End: ${new Date(periodEndDate).toISOString().slice(0, 10)}`);
    const transaction = await sequelize.transaction();

    try {
        const paySchedule = await sequelize.models.PaySchedule.findByPk(payScheduleId, { transaction });
        if (!paySchedule || paySchedule.tenantId !== tenantId) {
            throw new Error('Pay Schedule not found or does not belong to the specified tenant.');
        }

        const periodStartDate = calculatePeriodStartDate(new Date(periodEndDate), paySchedule.frequency);

        // Allow overwriting "draft" or "failed" runs but block "completed" runs.
        const existingRun = await PayrollRun.findOne({ where: { tenantId, payScheduleId, periodEnd: periodEndDate }, transaction });
        if (existingRun) {
            if (['completed', 'paid'].includes(existingRun.status)) {
                throw new Error(`A finalized payroll run for this period already exists (Status: ${existingRun.status}).`);
            }
            console.log(`  - Found existing transient run (ID: ${existingRun.id}). Deleting to start over.`);
            await Payslip.destroy({ where: { payrollRunId: existingRun.id }, transaction, force: true });
            await existingRun.destroy({ transaction, force: true });
        }

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
                model: EmployeeSalarySetting, as: 'employeeSalarySettings', where: { isActive: true }, required: false,
                include: [{ model: SalaryComponent, as: 'salaryComponent', where: { isActive: true } }]
            }],
            transaction
        });

        if (activeEmployees.length === 0) {
            await payrollRun.update({ status: 'completed', notes: 'No active employees found for this period.' }, { transaction });
            await transaction.commit();
            console.log('✅ Payroll processing completed. No active employees.');
            return { payrollRun, payslips: [] };
        }
        console.log(`  - Found ${activeEmployees.length} active employee(s). Processing...`);

        const createdPayslips = [];
        let totalGrossPayRun = 0, totalDeductionsRun = 0, totalTaxesRun = 0, totalNetPayRun = 0;

        for (const employee of activeEmployees) {
            const context = {
                payslipItems: [],
                variables: new Map(),
                grossPay: 0,
                cnssBase: 0,
                amoBase: 0,
                taxableSalary: 0, // This will be the gross taxable salary
                totalDeductions: 0,
                totalTaxes: 0,
            };

            const settings = employee.employeeSalarySettings || [];
            const findSetting = (code) => settings.find(s => s.salaryComponent?.componentCode === code);

            // --- Phase 1: Process Earnings & Calculate Gross Pay ---
            for (const setting of settings.filter(s => s.salaryComponent?.type === 'earning')) {
                let amount = 0;
                const component = setting.salaryComponent;
                
                if (component.calculationType === 'fixed') {
                    amount = parseFloat(setting.amount || component.amount || 0);
                } else if (component.calculationType === 'percentage') {
                    const baseSalary = context.variables.get('BASE_SALARY_MONTHLY') || 0;
                    amount = baseSalary * (parseFloat(setting.percentage || component.percentage || 0) / 100);
                } else if (component.calculationType === 'formula' && component.componentCode === 'SENIORITY_BONUS') {
                    const yearsOfService = (new Date() - new Date(employee.hireDate)) / (1000 * 60 * 60 * 24 * 365.25);
                    const baseSalary = context.variables.get('BASE_SALARY_MONTHLY') || 0;
                    let percentage = 0;
                    if (yearsOfService >= 25) percentage = 0.25;
                    else if (yearsOfService >= 20) percentage = 0.20;
                    else if (yearsOfService >= 12) percentage = 0.15;
                    else if (yearsOfService >= 5) percentage = 0.10;
                    else if (yearsOfService >= 2) percentage = 0.05;
                    amount = baseSalary * percentage;
                }

                if (component.componentCode) {
                    context.variables.set(component.componentCode, amount);
                }
                
                context.grossPay += amount;
                if (component.isTaxable) context.taxableSalary += amount;
                if (component.isCnssSubject) context.cnssBase += amount;
                if (component.isAmoSubject) context.amoBase += amount;
                
                context.payslipItems.push({
                    salaryComponentId: component.id, description: component.name,
                    type: 'earning', amount: parseFloat(amount.toFixed(2))
                });
            }

            // --- Phase 2: Calculate Statutory Deductions (CNSS, AMO) ---
            let netTaxableSalary = context.taxableSalary;
            const cnssSetting = findSetting('CNSS_EMPLOYEE');
            if (cnssSetting) {
                const cnssBaseCapped = Math.min(context.cnssBase, 6000); // CNSS base is capped
                const cnssAmount = cnssBaseCapped * (parseFloat(cnssSetting.salaryComponent.percentage) / 100);
                netTaxableSalary -= cnssAmount;
                context.totalTaxes += cnssAmount;
                context.payslipItems.push({
                    salaryComponentId: cnssSetting.salaryComponent.id, description: cnssSetting.salaryComponent.name,
                    type: 'deduction', amount: parseFloat(cnssAmount.toFixed(2))
                });
            }

            const amoSetting = findSetting('AMO_EMPLOYEE');
            if (amoSetting) {
                const amoAmount = context.amoBase * (parseFloat(amoSetting.salaryComponent.percentage) / 100); // AMO base is not capped
                netTaxableSalary -= amoAmount;
                context.totalTaxes += amoAmount;
                context.payslipItems.push({
                    salaryComponentId: amoSetting.salaryComponent.id, description: amoSetting.salaryComponent.name,
                    type: 'deduction', amount: parseFloat(amoAmount.toFixed(2))
                });
            }
            
            // --- Phase 3: Deduct Professional Fees (Frais Professionnels) ---
            const professionalFeesDeduction = Math.min(netTaxableSalary * 0.20, 2500); // 20% capped at 2500 MAD/month
            netTaxableSalary -= professionalFeesDeduction;

            // --- Phase 4: Calculate Income Tax (IGR) ---
            const igrSetting = findSetting('IGR_MONTHLY');
            if (igrSetting) {
                const annualNetTaxable = netTaxableSalary * 12;
                // TODO: Deduct family charges (dependents) from annualNetTaxable before calculating IGR
                const annualIgr = calculateIGR(annualNetTaxable);
                const monthlyIgr = annualIgr / 12;

                if (monthlyIgr > 0) {
                    context.totalTaxes += monthlyIgr;
                    context.payslipItems.push({
                        salaryComponentId: igrSetting.salaryComponent.id, description: igrSetting.salaryComponent.name,
                        type: 'tax', amount: parseFloat(monthlyIgr.toFixed(2))
                    });
                }
            }
            
            // --- Phase 5: Process Other Deductions ---
            for (const setting of settings.filter(s => s.salaryComponent?.type === 'deduction' && !s.salaryComponent.componentCode)) {
                // This handles custom, non-statutory deductions
                const amount = parseFloat(setting.amount || 0); // Assuming they are fixed for now
                context.totalDeductions += amount;
                context.payslipItems.push({
                    salaryComponentId: setting.salaryComponent.id, description: setting.salaryComponent.name,
                    type: 'deduction', amount: parseFloat(amount.toFixed(2))
                });
            }

            // --- Phase 6: Finalization ---
            const totalDeductionsForPayslip = context.totalTaxes + context.totalDeductions;
            const netPay = context.grossPay - totalDeductionsForPayslip;

            const payslip = await Payslip.create({
                tenantId, payrollRunId: payrollRun.id, employeeId: employee.id,
                grossPay: parseFloat(context.grossPay.toFixed(2)),
                deductions: parseFloat(context.totalDeductions.toFixed(2)), // Non-tax deductions
                taxes: parseFloat(context.totalTaxes.toFixed(2)), // All statutory/tax deductions
                netPay: parseFloat(netPay.toFixed(2)),
            }, { transaction });
            
            if (context.payslipItems.length > 0) {
                await PayslipItem.bulkCreate(
                    context.payslipItems.map(item => ({ ...item, payslipId: payslip.id, tenantId })),
                    { transaction }
                );
            }
            createdPayslips.push(payslip);

            // Update run totals
            totalGrossPayRun += context.grossPay;
            totalDeductionsRun += context.totalDeductions;
            totalTaxesRun += context.totalTaxes;
            totalNetPayRun += netPay;
        }

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
        console.error('❌ Error during payroll processing:', error);
        // If a run was created, mark it as 'failed'
        const runInProgress = await PayrollRun.findOne({ where: { status: 'processing', tenantId, payScheduleId, periodEnd: new Date(periodEndDate) }});
        if (runInProgress) {
            await runInProgress.update({ status: 'failed', notes: error.message });
        }
        throw error; // Re-throw the error to be handled by the route
    }
}

module.exports = { processPayroll, calculatePeriodStartDate, calculateIGR };