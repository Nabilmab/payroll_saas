// payrollEngine.js

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
} = require('./models');

/**
 * Determines the start date of a pay period.
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
            console.warn(`Warning: Unhandled frequency '${frequency}' for period start date calculation. Defaulting to start of month.`);
    }
    return startDate;
}

/**
 * calculateIGR
 * Implements the 2024 Moroccan progressive income-tax scale.
 * Source: Simplified based on general understanding, actual DGI rules are more complex.
 * Important: Assumes annual taxable base. Deductions for family charges, etc.,
 * should be applied BEFORE calling this function if they reduce the taxable base.
 * @param {number} annualTaxableBase - The annual taxable income in MAD.
 * @returns {number} The annual IGR owed (MAD), rounded to two decimals.
 */
function calculateIGR(annualTaxableBase) {
    const brackets = [
        { limit: 30000, rate: 0.00, deduction: 0 },       // 0% up to 30,000 MAD
        { limit: 50000, rate: 0.10, deduction: 3000 },    // 10% for income between 30,001 and 50,000 MAD (minus 30000 * 0.10)
        { limit: 60000, rate: 0.20, deduction: 8000 },    // 20% for income between 50,001 and 60,000 MAD (minus 50000 * 0.20 - 3000)
        { limit: 80000, rate: 0.30, deduction: 14000 },   // 30% for income between 60,001 and 80,000 MAD
        { limit: 180000, rate: 0.34, deduction: 17200 },  // 34% for income between 80,001 and 180,000 MAD
        { limit: Infinity, rate: 0.38, deduction: 24400 } // 38% for income above 180,000 MAD
    ];

    let annualIGR = 0;
    for (const bracket of brackets) {
        if (annualTaxableBase <= bracket.limit) {
            annualIGR = (annualTaxableBase * bracket.rate) - bracket.deduction;
            break;
        }
    }
    // Ensure IGR is not negative (e.g. for very low incomes falling into first bracket calculation)
    annualIGR = Math.max(0, annualIGR);
    return parseFloat(annualIGR.toFixed(2));
}

/**
 * Processes payroll for a given tenant and pay schedule.
 * This version implements a multi-pass approach.
 */
async function processPayroll(tenantId, payScheduleId, periodEndDate, paymentDate, processedByUserId = null) {
    console.log(`🚀 Starting payroll processing (multi-pass) for Tenant: ${tenantId}, Pay Schedule: ${payScheduleId}, Period End: ${periodEndDate.toISOString().slice(0,10)}`);
    const transaction = await sequelize.transaction();

    try {
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
                hire_date: { [Op.lte]: periodEndDate },
                [Op.or]: [{ termination_date: null }, { termination_date: { [Op.gte]: periodStartDate } }],
            },
            include: [{
                model: EmployeeSalarySetting, as: 'employeeSalarySettings', required: false, where: { is_active: true },
                include: [{ model: SalaryComponent, as: 'salaryComponent', where: { is_active: true } }]
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
            console.log(`    - Processing employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`);
            const employeeContext = {
                employee,
                settings: employee.employeeSalarySettings || [],
                payslipItems: [], // Stores { component, amount } for this employee
                monthlyBaseSalary: 0,
                cnssBase: 0,
                amoBase: 0,
                taxableSalaryMonthly: 0,
                netTaxableAnnual: 0, // Will be calculated from monthly taxable
                igrMonthly: 0,
                grossPay: 0,
                totalDeductions: 0, // All deductions (cnss, amo, igr, other)
                taxes: 0, // Specifically IGR, CNSS, AMO
                otherDeductions: 0 // Non-statutory deductions
            };

            // Determine Monthly Base Salary (Prerequisite for many calculations)
            const baseSalaryCompSetting = employeeContext.settings.find(s => s.salaryComponent && s.salaryComponent.component_code === 'BASE_SALARY_MONTHLY');
            let monthlyBaseSalaryAmount = 0;
            if (baseSalaryCompSetting) {
                if (baseSalaryCompSetting.amount !== null && baseSalaryCompSetting.amount !== undefined) {
                    monthlyBaseSalaryAmount = parseFloat(baseSalarySetting.amount);
                } else if (baseSalaryCompSetting.salaryComponent.amount !== null && baseSalaryCompSetting.salaryComponent.amount !== undefined) { // CORRECTED
                    monthlyBaseSalaryAmount = parseFloat(baseSalaryCompSetting.salaryComponent.amount); // CORRECTED
                }
            }
            employeeContext.monthlyBaseSalary = monthlyBaseSalaryAmount;
            employeeContext.payslipItems.push({ component: baseSalaryCompSetting.salaryComponent, amount: monthlyBaseSalaryAmount, type: 'earning' });
            employeeContext.grossPay += monthlyBaseSalaryAmount;
            if (baseSalaryCompSetting.salaryComponent.is_cnss_subject) employeeContext.cnssBase += monthlyBaseSalaryAmount;
            if (baseSalaryCompSetting.salaryComponent.is_amo_subject) employeeContext.amoBase += monthlyBaseSalaryAmount;
            if (baseSalaryCompSetting.salaryComponent.is_taxable) employeeContext.taxableSalaryMonthly += monthlyBaseSalaryAmount;

            // Pass 1: Calculate Fixed Earnings (excluding base salary already processed)
            console.log(`      Pass 1: Fixed Earnings`);
            for (const setting of employeeContext.settings) {
                const component = setting.salaryComponent;
                if (!component || component.component_code === 'BASE_SALARY_MONTHLY') continue;

                if (component.type === 'earning' && component.calculation_type === 'fixed') {
                    let itemAmountMonthly = parseFloat(setting.amount ?? component.amount ?? 0); // CORRECTED
                    employeeContext.payslipItems.push({ component, amount: itemAmountMonthly, type: 'earning' });
                    employeeContext.grossPay += itemAmountMonthly;
                    if (component.is_cnss_subject) employeeContext.cnssBase += itemAmountMonthly;
                    if (component.is_amo_subject) employeeContext.amoBase += itemAmountMonthly;
                    if (component.is_taxable) employeeContext.taxableSalaryMonthly += itemAmountMonthly;
                    console.log(`        - Fixed Earning: ${component.name}, Amount: ${itemAmountMonthly}`);
                }
            }

            // Pass 2: Calculate Percentage-Based Components (Earnings & Deductions, excluding CNSS/AMO/IGR)
            console.log(`      Pass 2: Percentage-Based Components`);
            for (const setting of employeeContext.settings) {
                const component = setting.salaryComponent;
                if (!component || component.calculation_type !== 'percentage') continue;
                if (['CNSS_EMPLOYEE', 'AMO_EMPLOYEE', 'IGR_MONTHLY'].includes(component.component_code)) continue; // Handled in statutory pass

                // Assuming percentage components are based on monthlyBaseSalary for now
                // A more robust system would use component.basedOnComponentId or similar
                let baseForPercentage = employeeContext.monthlyBaseSalary; // Default base
                // Example: if (component.based_on_code === 'GROSS_SALARY') baseForPercentage = employeeContext.grossPay; (would need careful ordering)

                let itemAmountMonthly = baseForPercentage * (parseFloat(component.percentage || 0) / 100);
                itemAmountMonthly = parseFloat(itemAmountMonthly.toFixed(2));

                employeeContext.payslipItems.push({ component, amount: itemAmountMonthly, type: component.type });
                if (component.type === 'earning') {
                    employeeContext.grossPay += itemAmountMonthly;
                    if (component.is_cnss_subject) employeeContext.cnssBase += itemAmountMonthly;
                    if (component.is_amo_subject) employeeContext.amoBase += itemAmountMonthly;
                    if (component.is_taxable) employeeContext.taxableSalaryMonthly += itemAmountMonthly;
                    console.log(`        - Percentage Earning: ${component.name}, Amount: ${itemAmountMonthly}`);
                } else { // Deduction
                    employeeContext.otherDeductions += itemAmountMonthly;
                    if (component.is_taxable) employeeContext.taxableSalaryMonthly -= itemAmountMonthly; // Deductions reducing taxable base
                    console.log(`        - Percentage Deduction: ${component.name}, Amount: ${itemAmountMonthly}`);
                }
            }

            // CNSS Cap for 2024 (example, replace with actual value from config/db)
            const CNSS_CAP_MONTHLY = 6000;
            employeeContext.cnssBase = Math.min(employeeContext.cnssBase, CNSS_CAP_MONTHLY);
            // AMO is usually uncapped, but check specific regulations if needed.

            // Pass 3: Calculate Statutory Deductions (CNSS, AMO) based on their respective bases
            console.log(`      Pass 3: Statutory Deductions (CNSS, AMO)`);
            for (const setting of employeeContext.settings) {
                const component = setting.salaryComponent;
                if (!component) continue;

                let itemAmountMonthly = 0;
                if (component.component_code === 'CNSS_EMPLOYEE') {
                    itemAmountMonthly = employeeContext.cnssBase * (parseFloat(component.percentage || 0) / 100);
                    itemAmountMonthly = parseFloat(itemAmountMonthly.toFixed(2));
                    employeeContext.taxes += itemAmountMonthly;
                    employeeContext.taxableSalaryMonthly -= itemAmountMonthly; // CNSS is deductible for IGR
                    console.log(`        - CNSS: Base=${employeeContext.cnssBase}, Amount: ${itemAmountMonthly}`);
                } else if (component.component_code === 'AMO_EMPLOYEE') {
                    itemAmountMonthly = employeeContext.amoBase * (parseFloat(component.percentage || 0) / 100);
                    itemAmountMonthly = parseFloat(itemAmountMonthly.toFixed(2));
                    employeeContext.taxes += itemAmountMonthly;
                    employeeContext.taxableSalaryMonthly -= itemAmountMonthly; // AMO is deductible for IGR
                    console.log(`        - AMO: Base=${employeeContext.amoBase}, Amount: ${itemAmountMonthly}`);
                } else {
                    continue; // Only process CNSS/AMO in this pass
                }
                employeeContext.payslipItems.push({ component, amount: itemAmountMonthly, type: 'deduction' });
            }

            // Calculate Net Taxable Annual for IGR
            // Professional expenses deduction (e.g., 20% capped at 30,000 MAD annually / 2500 MAD monthly)
            // This is a simplification; actual rules for frais professionnels are more nuanced.
            const fraisProPercentage = 0.20; // 20%
            const fraisProCapAnnual = 30000;
            const fraisProCapMonthly = fraisProCapAnnual / 12;

            let professionalExpensesMonthly = employeeContext.taxableSalaryMonthly * fraisProPercentage;
            professionalExpensesMonthly = Math.min(professionalExpensesMonthly, fraisProCapMonthly);
            professionalExpensesMonthly = parseFloat(professionalExpensesMonthly.toFixed(2));

            employeeContext.taxableSalaryMonthly -= professionalExpensesMonthly;
            employeeContext.taxableSalaryMonthly = Math.max(0, employeeContext.taxableSalaryMonthly); // Ensure not negative
            employeeContext.netTaxableAnnual = employeeContext.taxableSalaryMonthly * 12;

            // Pass 4: Calculate IGR (Formula-Based Deduction)
            console.log(`      Pass 4: IGR Calculation`);
            const igrComponentSetting = employeeContext.settings.find(s => s.salaryComponent && s.salaryComponent.component_code === 'IGR_MONTHLY');
            if (igrComponentSetting) {
                const igrAnnual = calculateIGR(employeeContext.netTaxableAnnual);
                employeeContext.igrMonthly = parseFloat((igrAnnual / 12).toFixed(2));
                employeeContext.taxes += employeeContext.igrMonthly;
                employeeContext.payslipItems.push({ component: igrComponentSetting.salaryComponent, amount: employeeContext.igrMonthly, type: 'deduction' });
                console.log(`        - IGR: NetTaxableAnnual=${employeeContext.netTaxableAnnual}, IGR_Annual=${igrAnnual}, IGR_Monthly=${employeeContext.igrMonthly}`);
            }

            // Pass 5: Other Fixed Deductions
            console.log(`      Pass 5: Other Fixed Deductions`);
            for (const setting of employeeContext.settings) {
                const component = setting.salaryComponent;
                if (!component || component.component_code === 'BASE_SALARY_MONTHLY') continue;
                if (['CNSS_EMPLOYEE', 'AMO_EMPLOYEE', 'IGR_MONTHLY'].includes(component.component_code)) continue;
                if (component.calculation_type === 'percentage') continue; // Already handled

                if (component.type === 'deduction' && component.calculation_type === 'fixed') {
                    let itemAmountMonthly = parseFloat(setting.amount ?? component.amount ?? 0);
                    employeeContext.payslipItems.push({ component, amount: itemAmountMonthly, type: 'deduction' });
                    employeeContext.otherDeductions += itemAmountMonthly;
                     // Assuming other fixed deductions might also reduce taxable base if not already accounted for
                    // This needs clarification based on specific component nature.
                    // if (component.is_taxable) employeeContext.taxableSalaryMonthly -= itemAmountMonthly; // This logic is tricky here
                    console.log(`        - Fixed Deduction: ${component.name}, Amount: ${itemAmountMonthly}`);
                }
            }

            employeeContext.totalDeductions = employeeContext.taxes + employeeContext.otherDeductions;
            const netPayEmployee = parseFloat((employeeContext.grossPay - employeeContext.totalDeductions).toFixed(2));

            const finalPayslipItemsData = [];
            for (const item of employeeContext.payslipItems) {
                if (item.amount !== 0 || await componentAllowsZeroAmount(item.component?.id)) {
                    finalPayslipItemsData.push({
                        tenantId,
                        componentId: item.component.id,
                        description: item.component.name,
                        type: item.type,
                        amount: item.amount,
                    });
                }
            }

            const payslip = await Payslip.create({
                tenantId, payrollRunId: payrollRun.id, employeeId: employee.id,
                grossPay: employeeContext.grossPay,
                deductions: employeeContext.otherDeductions, // Store non-statutory deductions
                taxes: employeeContext.taxes,              // Store statutory (CNSS, AMO, IGR)
                netPay: netPayEmployee,
            }, { transaction });

            if (finalPayslipItemsData.length > 0) {
                await PayslipItem.bulkCreate(finalPayslipItemsData.map(item => ({ ...item, payslipId: payslip.id })), { transaction });
            }
            createdPayslips.push(payslip);
            console.log(`      - Created Payslip ID: ${payslip.id}, Gross: ${employeeContext.grossPay}, Other Deductions: ${employeeContext.otherDeductions}, Taxes: ${employeeContext.taxes}, Net: ${netPayEmployee}`);

            totalGrossPayRun += employeeContext.grossPay;
            totalDeductionsRun += employeeContext.otherDeductions;
            totalTaxesRun += employeeContext.taxes;
        }

        totalGrossPayRun = parseFloat(totalGrossPayRun.toFixed(2));
        totalDeductionsRun = parseFloat(totalDeductionsRun.toFixed(2)); // sum of non-statutory
        totalTaxesRun = parseFloat(totalTaxesRun.toFixed(2));       // sum of statutory
        const totalNetPayRun = parseFloat((totalGrossPayRun - (totalDeductionsRun + totalTaxesRun)).toFixed(2));

        await payrollRun.update({
            totalGrossPay: totalGrossPayRun,
            totalDeductions: parseFloat((totalDeductionsRun + totalTaxesRun).toFixed(2)), // Sum of all deductions
            totalNetPay: totalNetPayRun,
            status: 'completed',
            total_employees: activeEmployees.length
        }, { transaction });
        console.log(`  - PayrollRun ID: ${payrollRun.id} updated. Gross: ${totalGrossPayRun}, Total Deductions: ${(totalDeductionsRun + totalTaxesRun).toFixed(2)}, Net: ${totalNetPayRun}`);

        await transaction.commit();
        console.log('✅ Payroll processing completed successfully and transaction committed.');
        return { payrollRun, payslips: createdPayslips };

    } catch (error) {
        if (transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
            await transaction.rollback();
        }
        console.error('❌ Error during payroll processing. Transaction potentially rolled back.', error);
        throw error;
    }
}

async function componentAllowsZeroAmount(componentId) {
    if (!componentId) return false;
    const component = await SalaryComponent.findByPk(componentId);
    // Example: Show 'Salaire de Base' even if zero for transparency, or other specific components.
    // This could be driven by a flag on the SalaryComponent model itself, e.g., `show_if_zero`.
    return component && component.component_code === 'BASE_SALARY_MONTHLY';
}

module.exports = { processPayroll, calculatePeriodStartDate, calculateIGR, componentAllowsZeroAmount };
