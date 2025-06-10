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
            // This baseSalaryAmountForPercentageCalcs is a simplification.
            // A more robust system might sum up all components flagged as 'contributes_to_percentage_base'.

            // --- B. Iterate over employee's salary settings ---
            for (const setting of employeeSettings) {
                const component = setting.salaryComponent;
                // Component might be null if the include failed or data is inconsistent
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
                    const percentage = parseFloat(component.percentage || setting.percentage || 0); // Prioritize component's % for system ones
                    // For Phase 2, assume system % components are based on `baseSalaryAmountForPercentageCalcs`
                    // A more advanced system would use `component.basedOnComponentId` or a `percentage_base_definition`
                    itemAmount = baseSalaryAmountForPercentageCalcs * (percentage / 100);
                    console.log(`        - Percentage (${percentage}%) of base (${baseSalaryAmountForPercentageCalcs}) = ${itemAmount}`);

                } else if (component.calculation_type === 'formula') {
                    // Placeholder for system-defined formula components (e.g., IGR)
                    // This requires a dedicated formula evaluation engine.
                    if (component.name.toLowerCase().includes('igr')) {
                        // itemAmount = calculateIGR(taxableBase, employeeSpecifics, taxBrackets);
                        // For now, let's assume it's a fixed placeholder amount or zero
                        console.warn(`        - Formula component '${component.name}' requires specific calculation. Placeholder used.`);
                        itemAmount = 0; // Replace with actual IGR calculation
                    } else {
                        console.warn(`        - Generic formula component '${component.name}' - logic not implemented.`);
                    }
                } else {
                    console.warn(`        - Unsupported calculation_type '${component.calculation_type}' for component '${component.name}'.`);
                }

                itemAmount = parseFloat(itemAmount.toFixed(2));

                // Add to payslip items if amount is not zero (or if you want to show zero-amount items)
                if (itemAmount !== 0 || true) { // Change `true` to `false` to hide zero items
                     payslipItemsData.push({
                        tenantId, // tenantId for the PayslipItem itself
                        // payslipId will be set after Payslip is created
                        componentId: component.id,
                        description: component.name,
                        type: component.type,
                        amount: itemAmount,
                    });
                }

                // Accumulate totals for the employee's payslip
                if (component.type === 'earning') {
                    grossPayEmployee += itemAmount;
                } else if (component.type === 'deduction') {
                    // Simple distinction for now: if 'taxable' is true, it's a tax.
                    // Or better, if component.name includes "Tax" or "IGR".
                    // A dedicated 'component_category' like 'TAX' would be best.
                    if (component.name.toLowerCase().includes('igr') || component.name.toLowerCase().includes('tax') || component.name.toLowerCase().includes('cnss') || component.name.toLowerCase().includes('amo')) {
                         taxesEmployee += itemAmount; // Grouping statutory deductions as "taxes" for simplicity
                    } else {
                        deductionsEmployee += itemAmount; // Other voluntary/company deductions
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
            totalDeductions: totalDeductionsRun, // Storing non-tax deductions separately
            // You might add a total_taxes field to PayrollRun model if needed
            // For now, totalDeductions on PayrollRun could represent sum of all deductions (tax + non-tax)
            // Let's adjust to sum them up for PayrollRun.totalDeductions
            totalDeductions: parseFloat((totalDeductionsRun + totalTaxesRun).toFixed(2)),
            totalNetPay: totalNetPayRun,
            status: 'completed', // Or 'pending_review'
            total_employees: activeEmployees.length
        }, { transaction });
        console.log(`  - PayrollRun ID: ${payrollRun.id} updated. Gross: ${totalGrossPayRun}, Deductions (incl. tax): ${(totalDeductionsRun + totalTaxesRun).toFixed(2)}, Net: ${totalNetPayRun}`);

        // --- 6. Commit Transaction ---
        await transaction.commit();
        console.log('✅ Payroll processing completed successfully and transaction committed.');
        return { payrollRun, payslips: createdPayslips };

    } catch (error) {
        if (transaction.finished !== 'commit' && transaction.finished !== 'rollback') { // Check if not already committed or rolled back
            await transaction.rollback();
        }
        console.error('❌ Error during payroll processing. Transaction potentially rolled back.', error);
        throw error;
    }
}

module.exports = { processPayroll, calculatePeriodStartDate }; // Exporting helper too
