// backend/services/payrollEngine.js
import prisma from '../lib/prisma.js';
import { evaluate } from 'mathjs'; // Make sure to run: npm install mathjs

/**
 * NEW: A generic, data-driven tax calculation function.
 * It fetches tax brackets for a given jurisdiction and year from the DB and calculates the tax.
 * @param {number} annualTaxableBase - The total annual taxable income.
 * @param {string} jurisdictionId - The ID of the jurisdiction (e.g., 'MA').
 * @param {number} year - The year for which to fetch tax brackets.
 * @param {object} tx - The Prisma transaction client.
 * @returns {Promise<number>} The calculated annual tax amount.
 */
async function calculateTaxFromBrackets(annualTaxableBase, jurisdictionId, year, tx) {
    const brackets = await tx.taxBracket.findMany({
        where: { jurisdictionId: jurisdictionId, year: year },
        orderBy: { incomeMin: 'asc' },
    });

    if (brackets.length === 0) {
        console.warn(`⚠️ No tax brackets found for jurisdiction ${jurisdictionId} for the year ${year}. Returning 0 tax.`);
        return 0;
    }

    let annualTax = 0;
    for (const bracket of brackets) {
        // Prisma Decimal needs to be converted to Number for comparison
        const limit = bracket.incomeMax ? Number(bracket.incomeMax) : Infinity;
        if (annualTaxableBase <= limit) {
            const rate = Number(bracket.rate);
            const deduction = Number(bracket.flatDeduction);
            annualTax = (annualTaxableBase * rate) - deduction;
            break;
        }
    }
    return parseFloat(Math.max(0, annualTax).toFixed(2));
}

// Helper to safely evaluate a formula string using a given context.
function evaluateFormula(formula, context) {
    try {
        return evaluate(formula, context);
    } catch (error) {
        console.error(`Error evaluating formula "${formula}" with context:`, context, error);
        return 0; // Return 0 or throw an error on failure
    }
}


function calculatePeriodStartDate(periodEndDate, frequency) {
    const startDate = new Date(periodEndDate);
    switch (frequency) {
        case 'monthly': startDate.setDate(1); break;
        default: startDate.setDate(1);
    }
    return startDate;
}

/**
 * REFACTORED: The core payroll processing engine.
 * This function is now a "dumb" executor that follows the steps defined in the `CalculationStep` model.
 */
async function processPayroll(tenantId, payScheduleId, periodEndDate, paymentDate, processedByUserId = null) {
    console.log(`🚀 Starting DYNAMIC payroll processing for Tenant: ${tenantId}`);

    return await prisma.$transaction(async (tx) => {
        // 1. Fetch Tenant, Jurisdiction, and Calculation Rules
        const tenant = await tx.tenant.findUnique({
            where: { id: tenantId },
            include: { jurisdiction: true }
        });
        if (!tenant) throw new Error(`Tenant with ID ${tenantId} not found.`);
        if (!tenant.jurisdiction) throw new Error(`Tenant ${tenantId} is not associated with a jurisdiction.`);
        
        const paySchedule = await tx.paySchedule.findFirst({ where: { id: payScheduleId, tenantId: tenantId } });
        if (!paySchedule) throw new Error('Pay Schedule not found or does not belong to the tenant.');

        const calculationSteps = await tx.calculationStep.findMany({
            where: { jurisdictionId: tenant.jurisdictionId },
            orderBy: { executionOrder: 'asc' },
        });
        if (calculationSteps.length === 0) {
            throw new Error(`No calculation steps found for jurisdiction: ${tenant.jurisdiction.name}`);
        }

        // 2. Create the initial PayrollRun record
        const periodStartDate = calculatePeriodStartDate(new Date(periodEndDate), paySchedule.frequency);
        const payrollRun = await tx.payrollRun.create({
            data: {
                tenantId, payScheduleId, periodStart: periodStartDate, periodEnd: new Date(periodEndDate),
                paymentDate: new Date(paymentDate), status: 'processing', processedByUserId,
            }
        });

        const activeEmployees = await tx.employee.findMany({
            where: { tenantId, status: 'active', hireDate: { lte: new Date(periodEndDate) } },
            include: { salarySettings: { where: { isActive: true }, include: { salaryComponent: true } } }
        });
        
        if (activeEmployees.length === 0) {
            await tx.payrollRun.update({ where: { id: payrollRun.id }, data: { status: 'completed', notes: 'No active employees found for this period.' } });
            return { payrollRun, payslips: [] };
        }

        const createdPayslips = [];
        let totalGrossPayRun = 0, totalDeductionsRun = 0, totalTaxesRun = 0, totalNetPayRun = 0;

        // 3. Process each employee
        for (const employee of activeEmployees) {
            const payrollContext = {}; // This object will hold all calculated values for the current employee.
            const payslipItemsData = []; // This will hold the items to be created for the payslip.
            const activeSettings = employee.salarySettings.filter(s => s.salaryComponent?.isActive);

            // Populate initial payslip items from employee settings
            activeSettings.forEach(s => {
                const amount = s.amount ? Number(s.amount) : 0;
                payslipItemsData.push({
                    salaryComponentId: s.salaryComponentId,
                    description: s.salaryComponent.name,
                    type: s.salaryComponent.type,
                    amount: amount
                });
            });

            // 4. Execute the Calculation Steps in order
            for (const step of calculationSteps) {
                let result = 0;
                // A. Handle special, non-mathematical formulas
                if (step.formula === 'SUM_EARNINGS') {
                    result = activeSettings
                        .filter(s => s.salaryComponent.type === 'earning')
                        .reduce((sum, s) => sum + Number(s.amount || 0), 0);
                } else if (step.formula === 'SUM_TAXABLE_EARNINGS') {
                    result = activeSettings
                        .filter(s => s.salaryComponent.type === 'earning' && s.salaryComponent.isTaxable)
                        .reduce((sum, s) => sum + Number(s.amount || 0), 0);
                } else if (step.formula === 'SUM_CUSTOM_DEDUCTIONS') {
                    result = activeSettings
                        .filter(s => s.salaryComponent.type === 'deduction' && !s.salaryComponent.isSystemDefined)
                        .reduce((sum, s) => sum + Number(s.amount || 0), 0);
                } 
                // B. Handle the special tax calculation function
                else if (step.formula.startsWith('CALCULATE_TAX')) {
                    const baseKey = step.formula.match(/\(([^)]+)\)/)[1]; // Extracts 'netTaxableAnnual'
                    const baseValue = payrollContext[baseKey] || 0;
                    const annualTax = await calculateTaxFromBrackets(baseValue, tenant.jurisdictionId, new Date(periodEndDate).getFullYear(), tx);
                    const finalFormula = step.formula.replace(`CALCULATE_TAX(${baseKey})`, annualTax.toString());
                    result = evaluateFormula(finalFormula, payrollContext);
                }
                // C. Handle all other standard mathematical formulas
                else {
                    result = evaluateFormula(step.formula, payrollContext);
                }
                
                // Store the result in the context for the next steps to use
                payrollContext[step.targetContextKey] = result;

                // If this step creates a system-defined payslip item (like CNSS, IGR), add it to our list.
                if (step.targetComponentId) {
                    const comp = await tx.salaryComponent.findUnique({ where: { id: step.targetComponentId }});
                    if (comp) {
                        payslipItemsData.push({
                            salaryComponentId: comp.id,
                            description: comp.name,
                            type: comp.type,
                            amount: result,
                        });
                    }
                }
            }

            // 5. Create the Payslip and its items using the final context
            const payslip = await tx.payslip.create({
                data: {
                    tenantId, payrollRunId: payrollRun.id, employeeId: employee.id,
                    grossPay: parseFloat(Number(payrollContext.grossPay || 0).toFixed(2)),
                    deductions: parseFloat(Number(payrollContext.totalDeductions || 0).toFixed(2)),
                    taxes: parseFloat(Number(payrollContext.totalTaxes || 0).toFixed(2)),
                    netPay: parseFloat(Number(payrollContext.netPay || 0).toFixed(2)),
                    payslipItems: {
                        create: payslipItemsData.map(item => ({
                            tenantId,
                            salaryComponentId: item.salaryComponentId,
                            description: item.description,
                            type: item.type,
                            amount: parseFloat(Number(item.amount).toFixed(2))
                        }))
                    }
                }
            });
            createdPayslips.push(payslip);

            // 6. Accumulate totals for the PayrollRun
            totalGrossPayRun += (payrollContext.grossPay || 0);
            totalDeductionsRun += (payrollContext.totalDeductions || 0);
            totalTaxesRun += (payrollContext.totalTaxes || 0);
            totalNetPayRun += (payrollContext.netPay || 0);
        }

        // 7. Finalize the PayrollRun with totals
        const finalRunData = await tx.payrollRun.update({
            where: { id: payrollRun.id },
            data: {
                totalGrossPay: parseFloat(Number(totalGrossPayRun).toFixed(2)),
                // Total deductions on the run record includes custom deductions AND taxes
                totalDeductions: parseFloat(Number(totalDeductionsRun + totalTaxesRun).toFixed(2)),
                totalNetPay: parseFloat(Number(totalNetPayRun).toFixed(2)),
                status: 'completed',
                totalEmployees: activeEmployees.length
            }
        });
        
        console.log('✅ Dynamic payroll processing completed successfully.');
        return { payrollRun: finalRunData, payslips: createdPayslips };
    });
}

// OLD IGR function is no longer needed, it's replaced by calculateTaxFromBrackets
// function calculateIGR(annualTaxableBase) { ... }

export { calculateTaxFromBrackets as calculateIGR, processPayroll };