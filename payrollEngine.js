// payrollEngine.js

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
    User // If you need processedByUserId
} = require('./models'); // Assuming this file is in your project root

/**
 * Determines the start date of a pay period.
 * This is a simplified example. A real system would need robust date logic,
 * considering pay schedule specifics (day of week, specific days of month).
 * @param {Date} periodEndDate - The end date of the pay period.
 * @param {string} frequency - The pay schedule frequency ('weekly', 'bi_weekly', 'semi_monthly', 'monthly').
 * @returns {Date} The calculated start date of the pay period.
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
            // This is tricky and depends on how semi-monthly is defined (e.g., 1st-15th, 16th-end)
            // For simplicity, assuming if end is > 15th, start is 16th, else 1st.
            if (periodEndDate.getDate() > 15) {
                startDate.setDate(16);
            } else {
                startDate.setDate(1);
            }
            break;
        default:
            // Fallback for unknown or 'custom' - might need more specific logic
            startDate.setDate(1); // Default to start of month
            console.warn(`Warning: Unhandled frequency '${frequency}' for period start date calculation. Defaulting to start of month.`);
    }
    return startDate;
}


/**
 * calculateIGR
 *
 * Implements the 2025 Moroccan progressive income‐tax scale (“Impôt Général sur le Revenu”).
 *
 * Brackets (annual taxable income in MAD):
 *    0 ‑ 40,000   → 0%
 *    40,001 ‑ 60,000 → 10%
 *    60,001 ‑ 80,000 → 20%
 *    80,001 ‑ 100,000 → 30%
 *    100,001 ‑ 180,000 → 34%
 *    Above 180,000 → 37%
 *
 * We assume that `taxableBase` is already an annual figure in MAD.
 * If you need monthly or semi‑monthly withholding, you can prorate accordingly
 * (e.g., divide the annual taxable base into 12 or 24 before applying these brackets).
 *
 * @param {number} taxableBase – The annual taxable income (MAD) for this employee.
 * @returns {number} The annual IGR owed (MAD), rounded to two decimals.
 */
function calculateIGR(taxableBase) {
    let remaining = taxableBase;
    let tax = 0;

    // 1) 0 ‑ 40,000 @ 0%
    const bracket1Cap = 40000;
    if (remaining <= bracket1Cap) {
        return 0.00;
    }
    // Move on to next bracket
    remaining -= bracket1Cap;

    // 2) 40,001 ‑ 60,000 @ 10%
    const bracket2Cap = 20000; // (60,000 − 40,000)
    if (remaining <= bracket2Cap) {
        tax += remaining * 0.10;
        return parseFloat(tax.toFixed(2));
    }
    tax += bracket2Cap * 0.10;
    remaining -= bracket2Cap;

    // 3) 60,001 ‑ 80,000 @ 20%
    const bracket3Cap = 20000; // (80,000 − 60,000)
    if (remaining <= bracket3Cap) {
        tax += remaining * 0.20;
        return parseFloat(tax.toFixed(2));
    }
    tax += bracket3Cap * 0.20;
    remaining -= bracket3Cap;

    // 4) 80,001 ‑ 100,000 @ 30%
    const bracket4Cap = 20000; // (100,000 − 80,000)
    if (remaining <= bracket4Cap) {
        tax += remaining * 0.30;
        return parseFloat(tax.toFixed(2));
    }
    tax += bracket4Cap * 0.30;
    remaining -= bracket4Cap;

    // 5) 100,001 ‑ 180,000 @ 34%
    const bracket5Cap = 80000; // (180,000 − 100,000)
    if (remaining <= bracket5Cap) {
        tax += remaining * 0.34;
        return parseFloat(tax.toFixed(2));
    }
    tax += bracket5Cap * 0.34;
    remaining -= bracket5Cap;

    // 6) Above 180,000 @ 37%
    tax += remaining * 0.37;
    return parseFloat(tax.toFixed(2));
}


/**
 * Processes payroll for a given tenant and pay schedule.
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} payScheduleId - The ID of the pay schedule to run.
 * @param {Date} periodEndDate - The end date of the pay period (as a Date object).
 * @param {Date} paymentDate - The date the payment will be made (as a Date object).
 * @param {string} [processedByUserId] - Optional ID of the user initiating the run.
 * @returns {Promise<Object>} An object containing the created PayrollRun and its Payslips.
 */
async function processPayroll(tenantId, payScheduleId, periodEndDate, paymentDate, processedByUserId = null) {
    console.log(`🚀 Starting payroll processing for Tenant: ${tenantId}, Pay Schedule: ${payScheduleId}, Period End: ${periodEndDate.toISOString().slice(0,10)}`);

    const transaction = await sequelize.transaction();

    try {
        // --- 1. Validations and Initial Setup ---
        const tenant = await Tenant.findByPk(tenantId, { transaction });
        if (!tenant) throw new Error(`Tenant with ID ${tenantId} not found.`);

        const paySchedule = await PaySchedule.findByPk(payScheduleId, { transaction });
        if (!paySchedule) throw new Error(`Pay Schedule with ID ${payScheduleId} not found.`);
        if (paySchedule.tenantId !== tenantId) throw new Error('Pay Schedule does not belong to the specified tenant.');

        const periodStartDate = calculatePeriodStartDate(new Date(periodEndDate), paySchedule.frequency);

        // --- 2. Create the Master PayrollRun Record ---
        const payrollRun = await PayrollRun.create({
            tenantId,
            payScheduleId,
            periodStart: periodStartDate,
            periodEnd: periodEndDate,
            paymentDate: paymentDate,
            status: 'processing',
            processedByUserId,
        }, { transaction });
        console.log(`  - Created PayrollRun ID: ${payrollRun.id}`);

        // --- 3. Fetch Active Employees for this Pay Schedule and Period ---
        const activeEmployees = await Employee.findAll({
            where: {
                tenantId: tenantId,
                status: 'active',
                // Employee must be hired on or before the period ends
                hire_date: { [sequelize.Op.lte]: periodEndDate },
                // Employee must not be terminated before the period starts (or termination_date is null)
                [sequelize.Op.or]: [
                    { termination_date: null },
                    { termination_date: { [sequelize.Op.gte]: periodStartDate } }
                ],
                // TODO: Add payScheduleId to Employee model and filter here if employees can be on different schedules
                // payScheduleId: payScheduleId
            },
            include: [
                {
                    model: EmployeeSalarySetting,
                    as: 'employeeSalarySettings', // Alias from Employee model
                    required: false, // Use left join: get employees even if they have no settings yet
                    where: { is_active: true }, // Only active settings
                    include: [{
                        model: SalaryComponent,
                        as: 'salaryComponent', // Alias from EmployeeSalarySetting model
                        where: { is_active: true } // Only active components
                    }]
                }
            ],
            transaction
        });

        if (activeEmployees.length === 0) {
            await payrollRun.update({ status: 'completed', notes: 'No active employees found for this period.' }, { transaction });
            await transaction.commit();
            console.log('  - No active employees. Payroll run marked as completed (no payslips).');
            return { payrollRun, payslips: [] };
        }
        console.log(`  - Found ${activeEmployees.length} active employee(s).`);

        // --- 4. Process Each Employee ---
        let totalGrossPayRun = 0;
        let totalDeductionsRun = 0;
        let totalTaxesRun = 0;
        const createdPayslips = [];

        for (const employee of activeEmployees) {
            console.log(`    - Processing employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`);
            let grossPayEmployee = 0;
            let deductionsEmployee = 0; // Non-tax deductions
            let taxesEmployee = 0;    // Tax deductions
            const payslipItemsData = [];

            const employeeSettings = employee.employeeSalarySettings || [];

            // --- A. Calculate Base Salary first (if applicable and needed for percentage components) ---
            let baseSalaryAmountForPercentageCalcs = 0;
            const baseSalarySetting = employeeSettings.find(s =>
                s.salaryComponent && s.salaryComponent.name.toLowerCase().includes('salaire de base') // Heuristic
            );
            if (baseSalarySetting && baseSalarySetting.salaryComponent.calculation_type === 'fixed') {
                if (baseSalarySetting.amount !== null && baseSalarySetting.amount !== undefined) {
                    baseSalaryAmountForPercentageCalcs = parseFloat(baseSalarySetting.amount);
                } else if (baseSalarySetting.salaryComponent.amount !== null && baseSalarySetting.salaryComponent.amount !== undefined) {
                    baseSalaryAmountForPercentageCalcs = parseFloat(baseSalarySetting.salaryComponent.amount);
                }
            }
            // At this point, baseSalaryAmountForPercentageCalcs holds the fixed base salary (annual or monthly),
            // depending on how you’ve chosen to store it. If you store it monthly, you should annualize it:
            // e.g. const taxableBaseAnnual = baseSalaryAmountForPercentageCalcs * 12;
            // For simplicity below, we'll assume `baseSalaryAmountForPercentageCalcs` is already the annual figure.
            const taxableBaseAnnual = baseSalaryAmountForPercentageCalcs;

            // --- B. Iterate over employee's salary settings ---
            for (const setting of employeeSettings) {
                const component = setting.salaryComponent;
                if (!component) {
                    console.warn(`      - Warning: Skipping setting for employee ${employee.id} due to missing component data.`);
                    continue;
                }

                console.log(`      - Evaluating component: ${component.name} (Type: ${component.type}, Calc: ${component.calculation_type})`);
                let itemAmount = 0;

                if (component.calculation_type === 'fixed') {
                    if (setting.amount !== null && setting.amount !== undefined) {
                        itemAmount = parseFloat(setting.amount);
                    } else if (component.amount !== null && component.amount !== undefined) {
                        itemAmount = parseFloat(component.amount);
                    } else {
                        console.warn(`        - Warning: Fixed component '${component.name}' for employee ${employee.id} has no amount defined.`);
                    }

                } else if (component.calculation_type === 'percentage') {
                    const percentage = parseFloat(component.percentage || setting.percentage || 0);
                    // For Phase 2, assume system % components are based on `baseSalaryAmountForPercentageCalcs`
                    itemAmount = taxableBaseAnnual * (percentage / 100);
                    console.log(`        - Percentage (${percentage}%) of base (${taxableBaseAnnual}) = ${itemAmount}`);

                } else if (component.calculation_type === 'formula') {
                    // Here we detect IGR specifically
                    if (component.name.toLowerCase().includes('igr') || component.name.toLowerCase().includes('impôt général sur le revenu')) {
                        // Call calculateIGR using annual taxable base
                        itemAmount = calculateIGR(taxableBaseAnnual);
                        console.log(`        - IGR (formula) on base ${taxableBaseAnnual} = ${itemAmount}`);
                    } else {
                        console.warn(`        - Generic formula component '${component.name}' - logic not implemented.`);
                    }

                } else {
                    console.warn(`        - Unsupported calculation_type '${component.calculation_type}' for component '${component.name}'.`);
                }

                itemAmount = parseFloat(itemAmount.toFixed(2));

                // Add to payslip items (even if zero, for transparency)
                payslipItemsData.push({
                    tenantId, // tenantId for the PayslipItem itself
                    componentId: component.id,
                    description: component.name,
                    type: component.type,
                    amount: itemAmount,
                });

                // Accumulate totals for the employee's payslip
                if (component.type === 'earning') {
                    grossPayEmployee += itemAmount;
                } else if (component.type === 'deduction') {
                    // If component is IGR or any tax (CNSS/AMO etc.), group under `taxesEmployee`
                    if (component.name.toLowerCase().includes('igr') ||
                        component.name.toLowerCase().includes('tax') ||
                        component.name.toLowerCase().includes('cnss') ||
                        component.name.toLowerCase().includes('amo')) {
                        taxesEmployee += itemAmount;
                    } else {
                        deductionsEmployee += itemAmount;
                    }
                }
            } // End of settings loop for an employee

            grossPayEmployee = parseFloat(grossPayEmployee.toFixed(2));
            deductionsEmployee = parseFloat(deductionsEmployee.toFixed(2));
            taxesEmployee = parseFloat(taxesEmployee.toFixed(2));
            const netPayEmployee = parseFloat((grossPayEmployee - deductionsEmployee - taxesEmployee).toFixed(2));

            // Create Payslip record for the employee
            const payslip = await Payslip.create({
                tenantId,
                payrollRunId: payrollRun.id,
                employeeId: employee.id,
                grossPay: grossPayEmployee,
                deductions: deductionsEmployee,
                taxes: taxesEmployee,
                netPay: netPayEmployee,
            }, { transaction });

            // Bulk create PayslipItems for this payslip
            const itemsToCreate = payslipItemsData.map(item => ({ ...item, payslipId: payslip.id }));
            if (itemsToCreate.length > 0) {
                await PayslipItem.bulkCreate(itemsToCreate, { transaction });
            }
            createdPayslips.push(payslip);
            console.log(`      - Created Payslip ID: ${payslip.id}, Gross: ${grossPayEmployee}, Deductions: ${deductionsEmployee}, Taxes: ${taxesEmployee}, Net: ${netPayEmployee}`);

            // Accumulate run totals
            totalGrossPayRun += grossPayEmployee;
            totalDeductionsRun += deductionsEmployee; // Non-tax deductions
            totalTaxesRun += taxesEmployee;       // Tax deductions

        } // End of employee loop

        // --- 5. Update PayrollRun with Aggregated Totals and Final Status ---
        totalGrossPayRun = parseFloat(totalGrossPayRun.toFixed(2));
        totalDeductionsRun = parseFloat(totalDeductionsRun.toFixed(2));
        totalTaxesRun = parseFloat(totalTaxesRun.toFixed(2));
        const totalNetPayRun = parseFloat((totalGrossPayRun - totalDeductionsRun - totalTaxesRun).toFixed(2));

        await payrollRun.update({
            totalGrossPay: totalGrossPayRun,
            // Store overall deductions (tax + non-tax) in one field, if that’s how you want to track it:
            totalDeductions: parseFloat((totalDeductionsRun + totalTaxesRun).toFixed(2)),
            totalNetPay: totalNetPayRun,
            status: 'completed',
            total_employees: activeEmployees.length
        }, { transaction });
        console.log(`  - PayrollRun ID: ${payrollRun.id} updated. Gross: ${totalGrossPayRun}, Deductions (incl. tax): ${(totalDeductionsRun + totalTaxesRun).toFixed(2)}, Net: ${totalNetPayRun}`);

        // --- 6. Commit Transaction ---
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

module.exports = { processPayroll, calculatePeriodStartDate, calculateIGR };
