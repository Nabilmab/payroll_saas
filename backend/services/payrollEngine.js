// backend/services/payrollEngine.js
import prisma from '../lib/prisma.js';

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

function calculatePeriodStartDate(periodEndDate, frequency) {
    const startDate = new Date(periodEndDate);
    switch (frequency) {
        case 'monthly': startDate.setDate(1); break;
        default: startDate.setDate(1);
    }
    return startDate;
}

async function processPayroll(tenantId, payScheduleId, periodEndDate, paymentDate, processedByUserId = null) {
    console.log(`🚀 Starting payroll processing for Tenant: ${tenantId}, Pay Schedule: ${payScheduleId}`);
    
    return await prisma.$transaction(async (tx) => {
        const paySchedule = await tx.paySchedule.findFirst({ where: { id: payScheduleId, tenantId: tenantId } });
        if (!paySchedule) throw new Error('Pay Schedule not found or does not belong to the tenant.');

        const periodStartDate = calculatePeriodStartDate(new Date(periodEndDate), paySchedule.frequency);

        const payrollRun = await tx.payrollRun.create({
            data: {
                tenantId, payScheduleId, periodStart: periodStartDate, periodEnd: new Date(periodEndDate),
                paymentDate: new Date(paymentDate), status: 'processing', processedByUserId,
            }
        });

        const activeEmployees = await tx.employee.findMany({
            where: {
                tenantId,
                status: 'active',
                hireDate: { lte: new Date(periodEndDate) }
            },
            include: {
                salarySettings: {
                    where: { isActive: true },
                    include: { salaryComponent: true }
                }
            }
        });

        if (activeEmployees.length === 0) {
            await tx.payrollRun.update({ where: { id: payrollRun.id }, data: { status: 'completed', notes: 'No active employees found for this period.' } });
            return { payrollRun, payslips: [] };
        }
        
        const createdPayslips = [];
        let totalGrossPayRun = 0, totalDeductionsRun = 0, totalTaxesRun = 0, totalNetPayRun = 0;

        for (const employee of activeEmployees) {
            const activeSettings = employee.salarySettings.filter(s => s.salaryComponent?.isActive);
            const context = { grossPay: 0, taxablePay: 0, totalDeductions: 0, totalTaxes: 0, payslipItems: [] };

            activeSettings.filter(s => s.salaryComponent.type === 'earning').forEach(s => {
                const amount = s.amount || 0;
                context.grossPay = Number(context.grossPay) + Number(amount);
                if (s.salaryComponent.isTaxable) {
                    context.taxablePay = Number(context.taxablePay) + Number(amount);
                }
                context.payslipItems.push({ salaryComponentId: s.salaryComponentId, description: s.salaryComponent.name, type: 'earning', amount });
            });
            
            const cnssAmount = Math.min(context.taxablePay, 6000) * 0.0448;
            const amoAmount = context.taxablePay * 0.0226;
            const annualTaxable = (context.taxablePay - cnssAmount - amoAmount) * 12;
            const igrAmount = calculateIGR(annualTaxable) / 12;
            context.totalTaxes = cnssAmount + amoAmount + igrAmount;
            
            activeSettings.filter(s => s.salaryComponent.type === 'deduction' && !s.salaryComponent.isSystemDefined).forEach(s => {
                const amount = s.amount || 0;
                context.totalDeductions = Number(context.totalDeductions) + Number(amount);
                context.payslipItems.push({ salaryComponentId: s.salaryComponentId, description: s.salaryComponent.name, type: 'deduction', amount });
            });
            
            const netPay = context.grossPay - context.totalDeductions - context.totalTaxes;

            const payslip = await tx.payslip.create({
                data: {
                    tenantId, payrollRunId: payrollRun.id, employeeId: employee.id,
                    grossPay: parseFloat(Number(context.grossPay).toFixed(2)),
                    deductions: parseFloat(Number(context.totalDeductions).toFixed(2)),
                    taxes: parseFloat(Number(context.totalTaxes).toFixed(2)),
                    netPay: parseFloat(Number(netPay).toFixed(2)),
                    payslipItems: {
                        create: context.payslipItems.map(item => ({
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

            totalGrossPayRun += Number(context.grossPay);
            totalDeductionsRun += Number(context.totalDeductions);
            totalTaxesRun += Number(context.totalTaxes);
            totalNetPayRun += Number(netPay);
        }

        const finalRunData = await tx.payrollRun.update({
            where: { id: payrollRun.id },
            data: {
                totalGrossPay: parseFloat(Number(totalGrossPayRun).toFixed(2)),
                totalDeductions: parseFloat(Number(totalDeductionsRun + totalTaxesRun).toFixed(2)),
                totalNetPay: parseFloat(Number(totalNetPayRun).toFixed(2)),
                status: 'completed',
                totalEmployees: activeEmployees.length
            }
        });
        
        console.log('✅ Payroll processing completed successfully.');
        return { payrollRun: finalRunData, payslips: createdPayslips };
    });
}

export { calculateIGR, processPayroll };