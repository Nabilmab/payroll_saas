const express = require('express');
const router = express.Router();
const { Employee, Department, EmployeeDependent } = require('../models');
const { check, validationResult } = require('express-validator');

// --- Employee Routes ---

// @route   GET api/employees
// @desc    Get all employees for the tenant
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const employees = await Employee.findAll({
      where: { tenantId },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/employees
// @desc    Add a new employee
// @access  Private
router.post(
  '/',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'A valid email is required').isEmail(),
    check('departmentId', 'Department ID is required').isUUID(),
    check('jobTitle', 'Job title is required').not().isEmpty(),
    check('hireDate', 'Hire date is required').isISO8601().toDate(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tenantId } = req.user;
    const { firstName, lastName, email, jobTitle, hireDate, departmentId, status } = req.body;

    try {
      const department = await Department.findOne({ where: { id: departmentId, tenantId } });
      if (!department) {
        return res.status(404).json({ msg: 'Department not found or not accessible.' });
      }

      const newEmployee = await Employee.create({
        tenantId,
        firstName,
        lastName,
        email,
        jobTitle,
        hireDate,
        departmentId,
        status: status || 'active',
      });

      res.status(201).json(newEmployee);
    } catch (err) {
      console.error(err.message);
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ msg: 'An employee with this email already exists for the tenant.' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/employees/:id
// @desc    Get a single employee by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const employee = await Employee.findOne({
      where: { id: req.params.id, tenantId },
      include: [
        { model: Department, as: 'department' },
        { model: EmployeeDependent, as: 'dependents', order: [['fullName', 'ASC']] },
      ],
    });

    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found or access denied.' });
    }
    res.json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/employees/:id
// @desc    Update an employee
// @access  Private
router.put('/:id', async (req, res) => {
  const { firstName, lastName, email, jobTitle, departmentId, status } = req.body;
  const { tenantId } = req.user;

  try {
    let employee = await Employee.findOne({ where: { id: req.params.id, tenantId } });
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found or access denied.' });
    }

    if (departmentId && departmentId !== employee.departmentId) {
      const department = await Department.findOne({ where: { id: departmentId, tenantId } });
      if (!department) {
        return res.status(404).json({ msg: 'New department not found or not accessible.' });
      }
    }

    const updatedEmployee = await employee.update({
      firstName: firstName || employee.firstName,
      lastName: lastName || employee.lastName,
      email: email || employee.email,
      jobTitle: jobTitle || employee.jobTitle,
      departmentId: departmentId || employee.departmentId,
      status: status || employee.status,
    });

    res.json(updatedEmployee);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ msg: 'An employee with this email already exists for the tenant.' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/employees/:id
// @desc    Delete an employee (soft delete)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.user;
    let employee = await Employee.findOne({ where: { id: req.params.id, tenantId } });

    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found or access denied.' });
    }

    await employee.destroy();
    res.status(204).send();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// --- Employee Dependent Routes (Nested) ---

// @route   POST /api/employees/:employeeId/dependents
// @desc    Create a new dependent for an employee
// @access  Private
router.post(
  '/:employeeId/dependents',
  [
    check('fullName', 'Full name is required').not().isEmpty(),
    check('relationship', 'Relationship is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { employeeId } = req.params;
      const { tenantId } = req.user;
      const { fullName, relationship, dateOfBirth, isFiscallyDependent } = req.body;

      const employee = await Employee.findOne({ where: { id: employeeId, tenantId } });
      if (!employee) return res.status(404).json({ error: 'Employee not found or access denied.' });

      const newDependent = await EmployeeDependent.create({
        tenantId,
        employeeId,
        fullName,
        relationship,
        dateOfBirth: dateOfBirth || null,
        isFiscallyDependent: isFiscallyDependent !== undefined ? isFiscallyDependent : true,
      });

      res.status(201).json(newDependent);
    } catch (err) {
      console.error('Error creating employee dependent:', err);
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'A dependent with these details might already exist.' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// @route   PUT /api/employees/:employeeId/dependents/:dependentId
// @desc    Update a specific dependent
// @access  Private
router.put('/:employeeId/dependents/:dependentId', async (req, res) => {
    const { fullName, relationship, dateOfBirth, isFiscallyDependent } = req.body;
    const { employeeId, dependentId } = req.params;
    const { tenantId } = req.user;

    try {
        const dependent = await EmployeeDependent.findOne({
            where: { id: dependentId, employeeId: employeeId, tenantId: tenantId }
        });

        if (!dependent) {
            return res.status(404).json({ msg: 'Dependent not found or access denied.' });
        }
        
        const updatedDependent = await dependent.update({
            fullName: fullName || dependent.fullName,
            relationship: relationship || dependent.relationship,
            dateOfBirth: dateOfBirth || dependent.dateOfBirth,
            isFiscallyDependent: isFiscallyDependent !== undefined ? isFiscallyDependent : dependent.isFiscallyDependent,
        });

        res.json(updatedDependent);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/employees/:employeeId/dependents/:dependentId
// @desc    Delete a specific dependent (soft delete)
// @access  Private
router.delete('/:employeeId/dependents/:dependentId', async (req, res) => {
    const { employeeId, dependentId } = req.params;
    const { tenantId } = req.user;

    try {
        const dependent = await EmployeeDependent.findOne({
            where: { id: dependentId, employeeId: employeeId, tenantId: tenantId }
        });

        if (!dependent) {
            return res.status(404).json({ msg: 'Dependent not found or access denied.' });
        }

        await dependent.destroy(); // Soft delete due to 'paranoid: true'
        res.status(204).send();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;