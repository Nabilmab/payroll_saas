const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
// CORRECTED: Use the 'validator' package, which is installed.
const validator = require('validator');
const { Employee, Payslip, PayrollRun, PayslipItem, SalaryComponent, sequelize } = require('../models');

// This single router will handle all payroll-related routes.
// We'll use specific paths to differentiate them.

// GET /api/payslips/:payslipId
router.get('/payslips/:payslipId', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { payslipId } = req.params;

        if (!validator.isUUID(payslipId)) {
            return res.status(400).json({ error: 'Invalid payslip ID format. Please provide a valid UUID.' });
        }

        const payslip = await Payslip.findOne({
            where: { id: payslipId, tenantId },
            include: [
                { model: Employee, as: 'employee' },
                { model: PayrollRun, as: 'payrollRun' },
                {
                    model: PayslipItem,
                    as: 'payslipItems',
                    include: [{ model: SalaryComponent, as: 'salaryComponent' }]
                }
            ],
            order: [
                [sequelize.literal('"payslipItems->salaryComponent"."payslip_display_order" ASC NULLS LAST')],
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

// GET /api/employees/:employeeId/payslips
router.get('/employees/:employeeId/payslips', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { employeeId } = req.params;
        if (!validator.isUUID(employeeId)) {
            return res.status(400).json({ error: 'Invalid employee ID format. Please provide a valid UUID.' });
        }
        const employee = await Employee.findOne({ where: { id: employeeId, tenantId } });
        if (!employee) {
            return res.json([]);
        }
        const payslips = await Payslip.findAll({
            where: { employeeId, tenantId },
            include: [{ model: PayrollRun, as: 'payrollRun', attributes: ['id', 'periodEnd', 'paymentDate', 'status'] }],
            order: [[{ model: PayrollRun, as: 'payrollRun' }, 'periodEnd', 'DESC'], ['createdAt', 'DESC']]
        });
        res.json(payslips);
    } catch (error) {
        console.error(`Error fetching payslips for employee ${req.params.employeeId}:`, error);
        res.status(500).json({ error: 'Failed to fetch employee payslips.' });
    }
});

// GET /api/employees/:employeeId/ytd-summary
router.get('/employees/:employeeId/ytd-summary', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { employeeId } = req.params;
        const { periodEndDate } = req.query;

        if (!periodEndDate) {
            return res.status(400).json({ error: 'periodEndDate query parameter is required.' });
        }
        const targetPeriodEndDate = new Date(periodEndDate);
        if (isNaN(targetPeriodEndDate.getTime())) {
            return res.status(400).json({ error: 'Invalid periodEndDate format.' });
        }
        const firstDayOfYear = new Date(targetPeriodEndDate.getFullYear(), 0, 1);
        const employee = await Employee.findOne({ where: { id: employeeId, tenantId: tenantId } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found or access denied.' });
        }
        const payslipsInYear = await Payslip.findAll({
            where: { employeeId: employeeId, tenantId: tenantId },
            include: [
                {
                    model: PayrollRun, as: 'payrollRun',
                    where: {
                        periodEnd: { [Op.gte]: firstDayOfYear, [Op.lte]: targetPeriodEndDate },
                        status: { [Op.in]: ['paid', 'approved', 'completed'] }
                    },
                    required: true
                },
                {
                    model: PayslipItem, as: 'payslipItems',
                    include: [{ model: SalaryComponent, as: 'salaryComponent', attributes: ['component_code'] }]
                }
            ]
        });
        const ytdSummary = { grossPay: 0, netPay: 0, totalDeductions: 0, totalTaxes: 0, items: {} };
        for (const payslip of payslipsInYear) {
            ytdSummary.grossPay += parseFloat(payslip.grossPay);
            ytdSummary.netPay += parseFloat(payslip.netPay);
            ytdSummary.totalDeductions += parseFloat(payslip.deductions);
            ytdSummary.totalTaxes += parseFloat(payslip.taxes);
            for (const item of payslip.payslipItems) {
                const key = item.salaryComponent?.component_code || item.description || 'unknown_item';
                if (!ytdSummary.items[key]) {
                    ytdSummary.items[key] = { description: item.description, type: item.type, amount: 0 };
                }
                ytdSummary.items[key].amount += parseFloat(item.amount);
            }
        }
        // Round all values
        for (const key in ytdSummary) {
            if (typeof ytdSummary[key] === 'number') ytdSummary[key] = parseFloat(ytdSummary[key].toFixed(2));
        }
        for (const key in ytdSummary.items) {
            ytdSummary.items[key].amount = parseFloat(ytdSummary.items[key].amount.toFixed(2));
        }
        res.json(ytdSummary);
    } catch (error) {
        console.error('Error fetching YTD summary:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

module.exports = router;
