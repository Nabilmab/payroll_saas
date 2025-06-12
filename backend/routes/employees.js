const express = require('express');
const router = express.Router();
// Updated import statement as per user feedback
const { Employee, Department, EmployeeDependent } = require('../models');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   POST api/employees
// @desc    Add new employee
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('position', 'Position is required').not().isEmpty(),
      check('department', 'Department is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, position, department, salary } = req.body;

    try {
      const newEmployee = new Employee({
        name,
        email,
        position,
        department,
        salary,
        user: req.user.id,
      });

      const employee = await newEmployee.save();
      res.json(employee);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/employees
// @desc    Get all employees
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const employees = await Employee.find({ user: req.user.id }).sort({
      date: -1,
    });
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/employees/:id
// @desc    Update employee
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { name, email, position, department, salary } = req.body;

  // Build employee object
  const employeeFields = {};
  if (name) employeeFields.name = name;
  if (email) employeeFields.email = email;
  if (position) employeeFields.position = position;
  if (department) employeeFields.department = department;
  if (salary) employeeFields.salary = salary;

  try {
    let employee = await Employee.findById(req.params.id);

    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    // Make sure user owns employee
    if (employee.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: employeeFields },
      { new: true }
    );

    res.json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/employees/:id
// @desc    Delete employee
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let employee = await Employee.findById(req.params.id);

    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    // Make sure user owns employee
    if (employee.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Employee.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Employee removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
