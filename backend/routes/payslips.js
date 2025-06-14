// backend/routes/payslips.js
import express from 'express';
import prisma from '../lib/prisma.js';
import validator from 'validator';

const router = express.Router();

// GET /api/payslips/for-run/:runId
router.get('/for-run/:runId', async (req, res) => {
    const { tenantId } = req.user;
    const { runId } = req.params;
    if (!validator.isUUID(runId)) return res.status(400).json({ error: 'Invalid run ID format.' });

    try {
        const payrollRun = await prisma.payrollRun.findFirst({ where: { id: runId, tenantId } });
        if (!payrollRun) return res.status(404).json({ error: 'Payroll run not found or access denied.' });

        const payslips = await prisma.payslip.findMany({
            where: { payrollRunId: runId, tenantId },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
                payrollRun: true
            },
            orderBy: { employee: { lastName: 'asc' } }
        });
        res.json(payslips);
    } catch (err) {
        console.error(`Error fetching payslips for run ${runId}:`, err);
        res.status(500).json({ error: 'Failed to fetch payslips for run.' });
    }
});

// GET /api/payslips/:payslipId
router.get('/:payslipId', async (req, res) => {
    const { tenantId } = req.user;
    const { payslipId } = req.params;
    if (!validator.isUUID(payslipId)) return res.status(400).json({ error: 'Invalid payslip ID format.' });

    try {
        const payslip = await prisma.payslip.findFirst({
            where: { id: payslipId, tenantId },
            include: {
                employee: { include: { department: { select: { name: true } } } },
                payrollRun: true,
                payslipItems: {
                    include: { salaryComponent: true },
                    orderBy: { salaryComponent: { payslipDisplayOrder: 'asc' } }
                }
            }
        });

        if (!payslip) return res.status(404).json({ error: 'Payslip not found or access denied.' });
        res.json(payslip);
    } catch (err) {
        console.error(`Error fetching payslip ${payslipId}:`, err);
        res.status(500).json({ error: 'Failed to fetch payslip.' });
    }
});

export default router;