// --- File: backend/routes/payrollRuns.js ---
const express = require('express');
const router = express.Router();
const { PayrollRun } = require('../models');
const { processPayroll } = require('../services/payrollEngine');
const { check, validationResult } = require('express-validator');

router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const runs = await PayrollRun.findAll({
            where: { tenantId },
            order: [['paymentDate', 'DESC']],
        });
        res.json(runs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/', [
        check('payScheduleId', 'Pay Schedule is required').isUUID(),
        check('periodEndDate', 'Period end date is required').isISO8601().toDate(),
        check('paymentDate', 'Payment date is required').isISO8601().toDate(),
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { tenantId, id: userId } = req.user;
        const { payScheduleId, periodEndDate, paymentDate } = req.body;
        try {
            const { payrollRun } = await processPayroll(tenantId, payScheduleId, periodEndDate, paymentDate, userId);
            res.status(201).json({ message: 'Payroll run initiated and completed successfully.', payrollRun });
        } catch (error) {
            console.error('Error starting payroll run:', error);
            res.status(500).json({ msg: 'An internal server error occurred while processing payroll.', error: error.message });
        }
    }
);

module.exports = router;