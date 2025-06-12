const express = require('express');
const router = express.Router();
// Updated import statement as per user feedback
const { Employee, EmployeeDependent } = require('../models');
// Removed: const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   POST api/dependents
// @desc    Add new dependent
// @access  Private
router.post(
  '/',
  [
    // auth, // Removed auth from route handler
    [
      check('name', 'Name is required').not().isEmpty(),
      check('relationship', 'Relationship is required').not().isEmpty(),
      check('employeeId', 'Employee ID is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, relationship, dateOfBirth, employeeId } = req.body;

    try {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ msg: 'Employee not found' });
      }

      // Make sure user owns employee
      if (employee.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const newDependent = new EmployeeDependent({ // Changed Dependent to EmployeeDependent
        name,
        relationship,
        dateOfBirth,
        employee: employeeId,
        user: req.user.id,
      });

      const dependent = await newDependent.save();
      res.json(dependent);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/dependents/employee/:employeeId
// @desc    Get all dependents for an employee
// @access  Private
router.get('/employee/:employeeId', async (req, res) => { // Removed auth from route handler
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Make sure user owns employee
    if (employee.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const dependents = await EmployeeDependent.find({ // Changed Dependent to EmployeeDependent
      employee: req.params.employeeId,
    }).sort({
      date: -1,
    });
    res.json(dependents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/dependents/:id
// @desc    Update dependent
// @access  Private
router.put('/:id', async (req, res) => { // Removed auth from route handler
  const { name, relationship, dateOfBirth } = req.body;

  // Build dependent object
  const dependentFields = {};
  if (name) dependentFields.name = name;
  if (relationship) dependentFields.relationship = relationship;
  if (dateOfBirth) dependentFields.dateOfBirth = dateOfBirth;

  try {
    let dependent = await EmployeeDependent.findById(req.params.id); // Changed Dependent to EmployeeDependent

    if (!dependent) return res.status(404).json({ msg: 'Dependent not found' });

    // Make sure user owns dependent
    if (dependent.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    dependent = await EmployeeDependent.findByIdAndUpdate( // Changed Dependent to EmployeeDependent
      req.params.id,
      { $set: dependentFields },
      { new: true }
    );

    res.json(dependent);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/dependents/:id
// @desc    Delete dependent
// @access  Private
router.delete('/:id', async (req, res) => { // Removed auth from route handler
  try {
    let dependent = await EmployeeDependent.findById(req.params.id); // Changed Dependent to EmployeeDependent

    if (!dependent) return res.status(404).json({ msg: 'Dependent not found' });

    // Make sure user owns dependent
    if (dependent.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await EmployeeDependent.findByIdAndRemove(req.params.id); // Changed Dependent to EmployeeDependent

    res.json({ msg: 'Dependent removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
