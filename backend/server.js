require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // We only need sequelize to test connection here
const { Op } = require('sequelize');

// CORRECTED: Import ALL models you'll need for your routes
const { User, Role, Employee, Department, SalaryComponent, Payslip, PayrollRun, PayslipItem, EmployeeDependent } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 

// --- A simple test route ---
app.get('/', (req, res) => {
  res.send('<h1>Payroll SaaS API is running!</h1>');
});

// --- LOGIN ROUTE (This one is working correctly) ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isPasswordValid = user.validPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    const user_data = user.toJSON();
    delete user_data.password_hash;

    res.json({
      message: 'Login successful!',
      user: user_data,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// FAKE Authentication Middleware
const authenticateAndAttachUser = async (req, res, next) => {
    try {
        const loggedInUser = await User.findOne({ 
            where: { email: 'manager.rh@techsolutions.ma' }
        });

        if (!loggedInUser) {
            return res.status(401).json({ error: 'Mock Authentication: User not found for testing.' });
        }
        req.user = loggedInUser; 
        next();
    } catch (error) {
        console.error("Mock auth error:", error);
        return res.status(500).json({ error: "Mock auth failed." });
    }
};

// EMPLOYEES ROUTE
app.get('/api/employees', authenticateAndAttachUser, async (req, res) => {
    try {
        if (!req.user || !req.user.tenantId) {
            return res.status(401).json({ error: 'User not authenticated or tenantId missing from user object.' });
        }
        const { tenantId } = req.user;
        const employees = await Employee.findAll({
            where: { tenantId: tenantId },
            include: [{ model: Department, as: 'department' }]
        });
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// SALARY COMPONENTS ROUTES
// GET all salary components
app.get('/api/salary-components', authenticateAndAttachUser, async (req, res) => {
    try {
        if (!req.user || !req.user.tenantId) {
            return res.status(401).json({ error: 'User not authenticated or tenantId missing from user object.' });
        }
        const { tenantId } = req.user;
        const salaryComponents = await SalaryComponent.findAll({
            where: {
                [Op.or]: [
                    { tenantId: tenantId },
                    { tenantId: null, is_system_defined: true, is_active: true }
                ]
            },
            order: [['is_system_defined', 'DESC'], ['name', 'ASC']]
        });
        res.json(salaryComponents);
    } catch (error) {
        console.error('Error fetching salary components:', error);
        res.status(500).json({ error: 'An internal server error occurred while fetching salary components.' });
    }
});

// CREATE SALARY COMPONENT
app.post('/api/salary-components', authenticateAndAttachUser, /* authorizeAdmin, */ async (req, res) => {
    try {
        const { tenantId } = req.user;
        // Destructure calculation_type, amount, and percentage
        const { name, description, type, calculation_type, amount, percentage, is_taxable, payslip_display_order, category } = req.body;

        const VALID_CATEGORIES = ['employee_earning', 'employee_deduction', 'employer_contribution_social', 'employer_contribution_other', 'statutory_deduction'];

        if (category && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
        }

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required.' });
        }
        if (!['earning', 'deduction'].includes(type)) {
            return res.status(400).json({ error: "Type must be 'earning' or 'deduction'." });
        }

        // Validate calculation_type
        const validCalculationTypes = ['fixed', 'percentage', 'formula'];
        if (!calculation_type || !validCalculationTypes.includes(calculation_type)) {
            return res.status(400).json({ error: `Calculation type must be one of: ${validCalculationTypes.join(', ')}.` });
        }

        const newSalaryComponentData = {
            tenantId,
            name,
            description,
            type,
            calculation_type, // Use destructured calculation_type
            is_taxable: !!is_taxable,
            is_system_defined: false,
            is_active: true,
            payslip_display_order: payslip_display_order ? parseInt(payslip_display_order, 10) : null,
            amount: null, // Initialize amount as null
            percentage: null, // Initialize percentage as null
            category: category // Add category, will use default from model if not provided
        };

        // Conditionally set amount or percentage
        if (calculation_type === 'fixed') {
            if (amount === undefined || amount === null) {
                return res.status(400).json({ error: 'Amount is required for fixed calculation type.' });
            }
            newSalaryComponentData.amount = parseFloat(amount);
        } else if (calculation_type === 'percentage') {
            if (percentage === undefined || percentage === null) {
                return res.status(400).json({ error: 'Percentage is required for percentage calculation type.' });
            }
            newSalaryComponentData.percentage = parseFloat(percentage);
        }
        // For 'formula', amount and percentage remain null

        const newSalaryComponent = await SalaryComponent.create(newSalaryComponentData);
        res.status(201).json(newSalaryComponent);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.error('Unique constraint error creating salary component:', error.errors);
            return res.status(409).json({ error: 'A salary component with this name already exists for your tenant.' });
        }
        console.error('Error creating salary component:', error);
        res.status(500).json({ error: 'An internal server error occurred while creating the salary component.' });
    }
});

// UPDATE SALARY COMPONENT
app.put('/api/salary-components/:componentId', authenticateAndAttachUser, /* authorizeAdmin, */ async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { componentId } = req.params;
        const { name, description, type, calculation_type, amount, percentage, is_taxable, is_active, payslip_display_order, category } = req.body;

        const VALID_CATEGORIES = ['employee_earning', 'employee_deduction', 'employer_contribution_social', 'employer_contribution_other', 'statutory_deduction'];

        if (category && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
        }

        const component = await SalaryComponent.findOne({
            where: { id: componentId, tenantId: tenantId, is_system_defined: false }
        });

        if (!component) {
            return res.status(404).json({ error: 'Custom salary component not found or access denied.' });
        }

        // Update basic fields
        if (name !== undefined) component.name = name;
        if (description !== undefined) component.description = description;
        if (type !== undefined) {
            if (!['earning', 'deduction'].includes(type)) {
                return res.status(400).json({ error: "Invalid type. Must be 'earning' or 'deduction'." });
            }
            component.type = type;
        }

        // 1. Update calculation_type if provided, and validate
        if (calculation_type !== undefined) {
            const validCalculationTypes = ['fixed', 'percentage', 'formula'];
            if (!validCalculationTypes.includes(calculation_type)) {
                return res.status(400).json({ error: `Calculation type must be one of: ${validCalculationTypes.join(', ')}.` });
            }
            component.calculation_type = calculation_type;
        }

        // 2. Apply logic based on the component's final calculation_type
        // (which could be the original one or the one updated above)
        if (component.calculation_type === 'fixed') {
            component.percentage = null; // Ensure percentage is null for fixed type
            if (amount !== undefined) { // Only update amount if it's actually provided
                if (amount === null) {
                    component.amount = null;
                } else {
                    const parsedAmount = parseFloat(amount);
                    if (isNaN(parsedAmount)) {
                        return res.status(400).json({ error: 'Invalid amount: must be a number or null for fixed calculation type.' });
                    }
                    component.amount = parsedAmount;
                }
            }
            // If amount is not provided in req.body, component.amount remains unchanged (unless calculation_type changed to fixed)
            // If calculation_type just changed to 'fixed', amount might be null from previous type, or its existing value.
            // If amount is not in req.body for an existing fixed type, it simply means no update to amount.
        } else if (component.calculation_type === 'percentage') {
            component.amount = null; // Ensure amount is null for percentage type
            if (percentage !== undefined) { // Only update percentage if it's actually provided
                if (percentage === null) {
                    component.percentage = null;
                } else {
                    const parsedPercentage = parseFloat(percentage);
                    if (isNaN(parsedPercentage)) {
                        return res.status(400).json({ error: 'Invalid percentage: must be a number or null for percentage calculation type.' });
                    }
                    component.percentage = parsedPercentage;
                }
            }
            // If percentage is not provided in req.body, component.percentage remains unchanged (unless calculation_type changed to percentage)
        } else if (component.calculation_type === 'formula') {
            component.amount = null;
            component.percentage = null;
        }

        // Update other fields
        if (is_taxable !== undefined) component.is_taxable = !!is_taxable;
        if (is_active !== undefined) component.is_active = !!is_active;
        if (payslip_display_order !== undefined) component.payslip_display_order = payslip_display_order ? parseInt(payslip_display_order, 10) : null;
        if (category !== undefined) component.category = category;

        await component.save();
        res.json(component);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.error('Unique constraint error updating salary component:', error.errors);
            return res.status(409).json({ error: 'A salary component with this name already exists for your tenant.' });
        }
        console.error('Error updating salary component:', error);
        res.status(500).json({ error: 'An internal server error occurred while updating the salary component.' });
    }
});

// DELETE SALARY COMPONENT
app.delete('/api/salary-components/:componentId', authenticateAndAttachUser, /* authorizeAdmin, */ async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { componentId } = req.params;

        const component = await SalaryComponent.findOne({
            where: { id: componentId, tenantId: tenantId, is_system_defined: false }
        });

        if (!component) {
            return res.status(404).json({ error: 'Custom salary component not found or access denied.' });
        }

        await component.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting salary component:', error);
        res.status(500).json({ error: 'An internal server error occurred while deleting the salary component.' });
    }
});

// --- EMPLOYEE DEPENDENTS ROUTES ---

// CREATE a new dependent for an employee
app.post('/api/employees/:employeeId/dependents', authenticateAndAttachUser, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { employeeId } = req.params;
        const { full_name, relationship, date_of_birth, is_fiscally_dependent, effective_start_date, notes } = req.body;

        // Basic validation
        if (!full_name || !relationship) {
            return res.status(400).json({ error: 'Full name and relationship are required.' });
        }

        // Check if employee exists and belongs to the tenant
        const employee = await Employee.findOne({ where: { id: employeeId, tenantId } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found or access denied.' });
        }

        const newDependent = await EmployeeDependent.create({
            tenantId,
            employeeId,
            full_name,
            relationship,
            date_of_birth: date_of_birth || null,
            is_fiscally_dependent: typeof is_fiscally_dependent === 'boolean' ? is_fiscally_dependent : true,
            effective_start_date: effective_start_date || new Date(),
            notes
        });

        res.status(201).json(newDependent);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'This dependent profile (name and DOB) might already exist for this employee.' });
        }
        console.error('Error creating employee dependent:', error);
        res.status(500).json({ error: 'Failed to create employee dependent.' });
    }
});

// GET all dependents for an employee
app.get('/api/employees/:employeeId/dependents', authenticateAndAttachUser, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { employeeId } = req.params;

        // Check if employee exists and belongs to the tenant
        const employee = await Employee.findOne({ where: { id: employeeId, tenantId } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found or access denied.' });
        }

        const dependents = await EmployeeDependent.findAll({
            where: { employeeId, tenantId, effective_end_date: null }, // Only currently active dependents
            order: [['full_name', 'ASC']]
        });
        res.json(dependents);
    } catch (error) {
        console.error('Error fetching employee dependents:', error);
        res.status(500).json({ error: 'Failed to fetch employee dependents.' });
    }
});

// GET a specific dependent by ID
app.get('/api/dependents/:dependentId', authenticateAndAttachUser, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { dependentId } = req.params;

        const dependent = await EmployeeDependent.findOne({
            where: { id: dependentId, tenantId },
            include: [{ model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name'] }] // Example include
        });

        if (!dependent) {
            return res.status(404).json({ error: 'Dependent not found or access denied.' });
        }
        res.json(dependent);
    } catch (error) {
        console.error('Error fetching dependent:', error);
        res.status(500).json({ error: 'Failed to fetch dependent.' });
    }
});

// UPDATE an employee's dependent
app.put('/api/dependents/:dependentId', authenticateAndAttachUser, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { dependentId } = req.params;
        const { full_name, relationship, date_of_birth, is_fiscally_dependent, effective_start_date, effective_end_date, notes } = req.body;

        const dependent = await EmployeeDependent.findOne({ where: { id: dependentId, tenantId } });
        if (!dependent) {
            return res.status(404).json({ error: 'Dependent not found or access denied.' });
        }

        // For updates affecting history (e.g., changing is_fiscally_dependent or "ending" a dependent)
        // you might implement a more sophisticated logic:
        // 1. Set `effective_end_date` on the current record.
        // 2. Create a new record with the changes and a new `effective_start_date`.
        // For simplicity here, we'll do a direct update.

        if (full_name !== undefined) dependent.full_name = full_name;
        if (relationship !== undefined) dependent.relationship = relationship;
        if (date_of_birth !== undefined) dependent.date_of_birth = date_of_birth; // Can be null
        if (is_fiscally_dependent !== undefined) dependent.is_fiscally_dependent = is_fiscally_dependent;
        if (effective_start_date !== undefined) dependent.effective_start_date = effective_start_date;
        if (effective_end_date !== undefined) dependent.effective_end_date = effective_end_date; // Can be null
        if (notes !== undefined) dependent.notes = notes;


        await dependent.save();
        res.json(dependent);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ error: 'This dependent profile (name and DOB) might already exist for this employee.' });
        }
        console.error('Error updating employee dependent:', error);
        res.status(500).json({ error: 'Failed to update employee dependent.' });
    }
});

// DELETE (soft delete) an employee's dependent
app.delete('/api/dependents/:dependentId', authenticateAndAttachUser, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { dependentId } = req.params;

        const dependent = await EmployeeDependent.findOne({ where: { id: dependentId, tenantId } });
        if (!dependent) {
            return res.status(404).json({ error: 'Dependent not found or access denied.' });
        }

        // If using paranoid: true, destroy() will soft delete.
        // If you want to explicitly set effective_end_date:
        // dependent.effective_end_date = new Date();
        // await dependent.save();
        await dependent.destroy();

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting employee dependent:', error);
        res.status(500).json({ error: 'Failed to delete employee dependent.' });
    }
});

// --- YTD SUMMARY ROUTE ---
app.get('/api/employees/:employeeId/ytd-summary', authenticateAndAttachUser, async (req, res) => {
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
        tenantId: tenantId,
      },
      include: [
        {
          model: PayrollRun,
          as: 'payrollRun',
          where: {
            periodEnd: {
              [Op.gte]: firstDayOfYear,
              [Op.lte]: targetPeriodEndDate,
            },
            status: {
              [Op.in]: ['paid', 'approved', 'completed'], // As per typical completed statuses
            },
          },
          required: true, // Ensures only payslips with matching payroll runs are returned
        },
        {
          model: PayslipItem,
          as: 'payslipItems',
          include: [
            {
              model: SalaryComponent,
              as: 'salaryComponent', // Ensure this alias matches the model definition
              attributes: ['component_code'], // Only fetch component_code
            },
          ],
        },
      ],
      order: [['createdAt', 'ASC']], // Or based on payrollRun.periodEnd
    });

    const ytdSummary = {
      grossPay: 0,
      netPay: 0,
      totalDeductions: 0, // Non-tax deductions
      totalTaxes: 0,
      items: {}, // To store aggregated amounts for each component_code or description
    };

    for (const payslip of payslipsInYear) {
      ytdSummary.grossPay += parseFloat(payslip.grossPay);
      ytdSummary.netPay += parseFloat(payslip.netPay);
      ytdSummary.totalDeductions += parseFloat(payslip.deductions);
      ytdSummary.totalTaxes += parseFloat(payslip.taxes);

      for (const item of payslip.payslipItems) {
        const itemAmount = parseFloat(item.amount);
        // Use component_code if available (from SalaryComponent), otherwise fall back to item.description
        const key = item.salaryComponent?.component_code || item.description || 'unknown_item';

        if (!ytdSummary.items[key]) {
          ytdSummary.items[key] = {
            description: item.description, // Store original description for clarity
            type: item.type, // Store item type
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


// --- Start the Server ---
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection is successful.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
  }
};

startServer();