const express = require('express');
const router = express.Router();
const { Employee, Payslip, PayrollRun, PayslipItem, SalaryComponent, sequelize } = require('../models');
const auth = require('../middleware/auth'); // Assuming auth middleware is correctly set up for Sequelize user
const { check, validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @route   GET /api/payslips/:payslipId (Note: Mounted under /api in server.js, so actual path is /api/payslips/:payslipId)
// @desc    Get single payslip record
// @access  Private
router.get('/payslips/:payslipId', auth, async (req, res) => {
  try {
    // Validate payslipId format if necessary (e.g., isUUID)
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }

    const payslip = await Payslip.findOne({
      where: {
        id: req.params.payslipId,
        tenantId: req.user.tenantId // Assuming tenantId is used for authorization from auth middleware
      },
      include: [
        {
          model: Employee,
          as: 'employee', // Ensure this alias matches your model association
          attributes: ['id', 'first_name', 'last_name', 'email'] // Specify attributes to include
        },
        {
          model: PayrollRun,
          as: 'payrollRun', // Ensure this alias matches your model association
        },
        {
          model: PayslipItem,
          as: 'payslipItems', // Ensure this alias matches your model association
          include: [{
            model: SalaryComponent,
            as: 'salaryComponent' // Ensure this alias matches your model association
          }]
        }
      ]
    });

    if (!payslip) {
      return res.status(404).json({ msg: 'Payslip not found or not authorized' });
    }

    // Additional check: Make sure user owns payslip if tenantId is not on payslip directly
    // This depends on your exact schema and how req.user is populated by `auth`
    // For example, if Payslip belongs to Employee which belongs to Tenant:
    // const employee = await Employee.findByPk(payslip.employeeId);
    // if (employee.tenantId !== req.user.tenantId) {
    //    return res.status(401).json({ msg: 'Not authorized' });
    // }

    res.json(payslip);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/employees/:employeeId/payslips (Mounted under /api, so actual path is /api/employees/:employeeId/payslips)
// @desc    Get all payslip records for an employee
// @access  Private
router.get('/employees/:employeeId/payslips', auth, async (req, res) => {
  try {
    // Validate employeeId
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }

    // First, check if the employee exists and belongs to the user's tenant
    const employee = await Employee.findOne({
      where: {
        id: req.params.employeeId,
        tenantId: req.user.tenantId // Authorization check
      }
    });

    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found or not authorized' });
    }

    const payslips = await Payslip.findAll({
      where: {
        employeeId: req.params.employeeId,
        tenantId: req.user.tenantId // Ensures payslips are also for the correct tenant
      },
      include: [
        { model: PayrollRun, as: 'payrollRun' } // Include payroll run details
      ],
      order: [
        [{ model: PayrollRun, as: 'payrollRun' }, 'periodEnd', 'DESC']
      ]
    });

    res.json(payslips);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/employees/:employeeId/ytd-summary (Mounted under /api)
// @desc    Get Year-to-Date payroll summary for an employee
// @access  Private
router.get('/employees/:employeeId/ytd-summary', auth, [
  check('periodEndDate', 'periodEndDate query parameter is required and should be a valid date string.').isISO8601().toDate()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { tenantId } = req.user; // From auth middleware
    const { employeeId } = req.params;
    const { periodEndDate } = req.query; // Already validated and converted to Date by express-validator

    const targetPeriodEndDate = periodEndDate; // Already a Date object
    const firstDayOfYear = new Date(targetPeriodEndDate.getFullYear(), 0, 1);

    // Validate employee existence and access
    const employee = await Employee.findOne({
      where: { id: employeeId, tenantId: tenantId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found or access denied.' });
    }

    const payslipsInYear = await Payslip.findAll({
      where: {
        employeeId: employeeId,
        tenantId: tenantId, // Ensure payslips belong to the tenant
      },
      include: [
        {
          model: PayrollRun,
          as: 'payrollRun', // Alias from Payslip model
          where: {
            periodEnd: { // Corrected from periodEndDate to periodEnd
              [Op.gte]: firstDayOfYear,
              [Op.lte]: targetPeriodEndDate,
            },
            status: { // Assuming PayrollRun status indicates completion/payment
              [Op.in]: ['paid', 'approved', 'completed'],
            },
          },
          required: true,
        },
        {
          model: PayslipItem,
          as: 'payslipItems', // Alias from Payslip model
          include: [
            {
              model: SalaryComponent,
              as: 'salaryComponent', // Alias from PayslipItem model
              attributes: ['component_code', 'name'],
            },
          ],
        },
      ],
      order: [[{model: PayrollRun, as: 'payrollRun'}, 'periodEnd', 'ASC']],
    });

    const ytdSummary = {
      grossPay: 0,
      netPay: 0,
      totalDeductions: 0,
      totalTaxes: 0,
      items: {},
    };

    for (const payslip of payslipsInYear) {
      ytdSummary.grossPay += parseFloat(payslip.gross_pay || payslip.grossPay || 0); // Adapt to actual field name
      ytdSummary.netPay += parseFloat(payslip.net_pay || payslip.netPay || 0);
      ytdSummary.totalDeductions += parseFloat(payslip.deductions || 0);
      ytdSummary.totalTaxes += parseFloat(payslip.taxes || 0);

      for (const item of payslip.payslipItems) {
        const itemAmount = parseFloat(item.amount || 0);
        const key = item.salaryComponent?.component_code || item.salaryComponent?.name || item.description || 'unknown_item';

        if (!ytdSummary.items[key]) {
          ytdSummary.items[key] = {
            description: item.salaryComponent?.name || item.description,
            type: item.type,
            amount: 0,
          };
        }
        ytdSummary.items[key].amount += itemAmount;
      }
    }

    // Round all monetary values to two decimal places
    ytdSummary.grossPay = parseFloat(ytdSummary.grossPay.toFixed(2));
    ytdSummary.netPay = parseFloat(ytdSummary.netPay.toFixed(2));
    ytdSummary.totalDeductions = parseFloat(ytdSummary.totalDeductions.toFixed(2));
    ytdSummary.totalTaxes = parseFloat(ytdSummary.totalTaxes.toFixed(2));

    for (const key in ytdSummary.items) {
      ytdSummary.items[key].amount = parseFloat(ytdSummary.items[key].amount.toFixed(2));
    }

    res.json(ytdSummary);

  } catch (error) {
    console.error('Error fetching YTD summary:', error);
    res.status(500).json({ error: 'An internal server error occurred while fetching YTD summary.' });
  }
});


module.exports = router;
