const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   POST api/payroll
// @desc    Add new payroll record
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('employeeId', 'Employee ID is required').not().isEmpty(),
      check('payPeriodStart', 'Pay period start date is required').isISO8601(),
      check('payPeriodEnd', 'Pay period end date is required').isISO8601(),
      check('grossPay', 'Gross pay is required').isNumeric(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      grossPay,
      deductions,
      netPay,
    } = req.body;

    try {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ msg: 'Employee not found' });
      }

      // Make sure user owns employee
      if (employee.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const newPayroll = new Payroll({
        employee: employeeId,
        payPeriodStart,
        payPeriodEnd,
        grossPay,
        deductions,
        netPay,
        user: req.user.id,
      });

      const payroll = await newPayroll.save();
      res.json(payroll);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/payroll/employee/:employeeId
// @desc    Get all payroll records for an employee
// @access  Private
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Make sure user owns employee
    if (employee.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const payrolls = await Payroll.find({
      employee: req.params.employeeId,
    }).sort({ payPeriodEnd: -1 });
    res.json(payrolls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/payroll/:id
// @desc    Get single payroll record
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('employee', [
      'name',
      'email',
    ]);

    if (!payroll) return res.status(404).json({ msg: 'Payroll record not found' });

    // Make sure user owns payroll
    if (payroll.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(payroll);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
