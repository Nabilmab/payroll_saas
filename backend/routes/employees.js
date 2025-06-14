// backend/routes/employees.js
import express from 'express';
import prisma from '../lib/prisma.js';
import { check, validationResult } from 'express-validator';

const router = express.Router();

// --- Employee Routes ---

// GET /api/employees
router.get('/', async (req, res) => {
  const { tenantId } = req.user;
  try {
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      include: { department: { select: { id: true, name: true } } },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/employees
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
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { tenantId } = req.user;
    const { firstName, lastName, email, jobTitle, hireDate, departmentId, status } = req.body;

    try {
      // Check if department exists for this tenant
      const department = await prisma.department.findFirst({
        where: { id: departmentId, tenantId },
      });
      if (!department) {
        return res.status(404).json({ msg: 'Department not found or not accessible.' });
      }

      const newEmployee = await prisma.employee.create({
        data: {
          tenantId, firstName, lastName, email, jobTitle, hireDate,
          departmentId: department.id,
          status: status || 'active',
        },
      });
      res.status(201).json(newEmployee);
    } catch (err) {
      if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
        return res.status(409).json({ msg: 'An employee with this email already exists.' });
      }
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// GET /api/employees/:id
router.get('/:id', async (req, res) => {
  const { tenantId } = req.user;
  try {
    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        department: true,
        dependents: { orderBy: { fullName: 'asc' } },
      },
    });

    if (!employee) return res.status(404).json({ msg: 'Employee not found or access denied.' });
    res.json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/employees/:id
router.put('/:id', async (req, res) => {
  const { firstName, lastName, email, jobTitle, departmentId, status } = req.body;
  const { tenantId } = req.user;

  try {
    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, tenantId },
    });
    if (!employee) return res.status(404).json({ msg: 'Employee not found or access denied.' });
    
    // If department is being changed, verify it belongs to the tenant
    if (departmentId && departmentId !== employee.departmentId) {
        const department = await prisma.department.findFirst({ where: { id: departmentId, tenantId }});
        if (!department) return res.status(404).json({ msg: 'New department not found or not accessible.' });
    }

    const updatedEmployee = await prisma.employee.update({
        where: { id: req.params.id },
        data: { firstName, lastName, email, jobTitle, departmentId, status },
    });

    res.json(updatedEmployee);
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(409).json({ msg: 'An employee with this email already exists.' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/employees/:id
// Note: Prisma does not have a "soft delete" feature like Sequelize's paranoid.
// This is an intentional design choice. The recommended way is to use a status field.
// We will update the status to "terminated" instead of deleting.
router.delete('/:id', async (req, res) => {
  const { tenantId } = req.user;
  try {
    // Check if the employee exists for the tenant first
    const employee = await prisma.employee.findFirst({ where: { id: req.params.id, tenantId } });
    if (!employee) return res.status(404).json({ msg: 'Employee not found or access denied.' });

    // "Soft delete" by updating status and setting termination date
    await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        status: 'terminated',
        terminationDate: new Date(),
      },
    });
    res.status(204).send();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// --- Employee Salary Settings Routes ---

// GET /api/employees/:employeeId/salary-settings
router.get('/:employeeId/salary-settings', async (req, res) => {
    const { tenantId } = req.user;
    const { employeeId } = req.params;
    try {
        const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId }});
        if (!employee) return res.status(404).json({ error: 'Employee not found or access denied.' });

        const settings = await prisma.employeeSalarySetting.findMany({
            where: { employeeId, isActive: true },
            include: { salaryComponent: true },
            orderBy: { salaryComponent: { payslipDisplayOrder: 'asc' } },
        });
        res.json(settings);
    } catch (err) {
        console.error('Error fetching salary settings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/employees/:employeeId/salary-settings
router.post(
  '/:employeeId/salary-settings',
  [
    check('salaryComponentId', 'Salary component is required').isUUID(),
    check('effectiveDate', 'Effective date is required').isISO8601().toDate(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { tenantId } = req.user;
    const { employeeId } = req.params;
    const { salaryComponentId, effectiveDate, amount, percentage } = req.body;

    try {
        const [employee, salaryComponent] = await Promise.all([
            prisma.employee.findFirst({ where: { id: employeeId, tenantId } }),
            prisma.salaryComponent.findFirst({ where: { id: salaryComponentId, tenantId } })
        ]);
        if (!employee) return res.status(404).json({ error: 'Employee not found.' });
        if (!salaryComponent) return res.status(404).json({ error: 'Salary Component not found.' });

        const newSetting = await prisma.employeeSalarySetting.create({
            data: { tenantId, employeeId, salaryComponentId, effectiveDate, amount, percentage, isActive: true },
        });
        res.status(201).json(newSetting);
    } catch(err) {
        if (err.code === 'P2002') {
          return res.status(409).json({ error: 'This salary component is already active for this employee.' });
        }
        console.error('Error creating salary setting:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ... (PUT and DELETE for salary-settings and dependents would follow the same pattern) ...

export default router;