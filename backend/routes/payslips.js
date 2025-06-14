// --- START OF NEW FILE ---
// ---
// backend/routes/payslips.js
// ---
const express = require('express');
const router = express.Router();
const { Employee, Payslip, PayrollRun, PayslipItem, SalaryComponent, Department, sequelize } = require('../models');
const validator = require('validator');

// @route   GET /api/payslips/for-run/:runId
// @desc    Get all payslips for a specific payroll run
// @access  Private
router.get('/for-run/:runId', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { runId } = req.params;

        if (!validator.isUUID(runId)) {
            return res.status(400).json({ error: 'Invalid run ID format.' });
        }

        const payrollRun = await PayrollRun.findOne({ where: { id: runId, tenantId } });
        if (!payrollRun) {
            return res.status(404).json({ error: 'Payroll run not found or access denied.' });
        }

        const payslips = await Payslip.findAll({
            where: { payrollRunId: runId, tenantId },
            include: [
                { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'jobTitle'] },
                { model: PayrollRun, as: 'payrollRun' } // Include run details with each payslip
            ],
            order: [[{ model: Employee, as: 'employee' }, 'lastName', 'ASC']]
        });
        res.json(payslips);
    } catch (error) {
        console.error(`Error fetching payslips for run ${req.params.runId}:`, error);
        res.status(500).json({ error: 'Failed to fetch payslips for run.' });
    }
});


// @route   GET /api/payslips/:payslipId
// @desc    Get details for a single payslip
// @access  Private
router.get('/:payslipId', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { payslipId } = req.params;

        if (!validator.isUUID(payslipId)) {
            return res.status(400).json({ error: 'Invalid payslip ID format.' });
        }

        const payslip = await Payslip.findOne({
            where: { id: payslipId, tenantId },
            include: [
                { model: Employee, as: 'employee', include: [{ model: Department, as: 'department', attributes: ['name'] }] },
                { model: PayrollRun, as: 'payrollRun' },
                {
                    model: PayslipItem,
                    as: 'payslipItems',
                    include: [{ model: SalaryComponent, as: 'salaryComponent' }]
                }
            ],
            order: [
                [sequelize.literal('"payslipItems->salaryComponent"."payslipDisplayOrder" ASC NULLS LAST')],
                [{ model: PayslipItem, as: 'payslipItems' }, 'type', 'ASC'],
                [{ model: PayslipItem, as: 'payslipItems' }, 'createdAt', 'ASC']
            ]
        });

        if (!payslip) {
            return res.status(404).json({ error: 'Payslip not found or access denied.' });
        }
        res.json(payslip);
    } catch (error) {
        console.error(`Error fetching payslip ${req.params.payslipId}:`, error);
        res.status(500).json({ error: 'Failed to fetch payslip.' });
    }
});

module.exports = router;