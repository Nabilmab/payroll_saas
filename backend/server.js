// Explicitly load .env from the project root
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
// Only import models that are used in *this* file (server.js)
const { User, sequelize } = require('./models');

// Import your new router
const salaryComponentRoutes = require('./routes/salaryComponents');
// You will import other routers here as you create them
// const employeeRoutes = require('./routes/employees');
// const dependentRoutes = require('./routes/dependents');
// ... etc

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

// --- API ROUTES ---
// Mount the router. All routes in salaryComponents.js will now be prefixed with /api/salary-components
// and will have the authentication middleware run first.
app.use('/api/salary-components', authenticateAndAttachUser, salaryComponentRoutes);

// Remove ALL the old app.get, app.post, app.put for /api/salary-components from this file.
// You will eventually do the same for all other routes (employees, dependents, etc.)

// ... (Your other route handlers for employees, YTD, payslips, etc. can stay here for now) ...
// ... (The ideal final state is that this section only contains `app.use(...)` lines) ...


// --- EMPLOYEE DEPENDENTS ROUTES ---

// CREATE a new dependent for an employee
app.post('/api/employees/:employeeId/dependents', authenticateAndAttachUser, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { employeeId } = req.params;

        // Define UUID validation regular expression
        const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

        // Validate employeeId format
        if (!UUID_REGEX.test(employeeId)) {
            return res.status(400).json({ error: 'Invalid employee ID format. Please provide a valid UUID.' });
        }

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

// --- PAYSLIP ROUTES ---

// GET a specific payslip by ID
app.get('/api/payslips/:payslipId', authenticateAndAttachUser, async (req, res) => {
    try {
        const { tenantId } = req.user; // Assuming authenticateAndAttachUser adds user to req
        const { payslipId } = req.params;

        // if (!validator.isUUID(payslipId)) { // validator is removed
        //     return res.status(400).json({ error: 'Invalid payslip ID format. Please provide a valid UUID.' });
        // }

        const payslip = await Payslip.findOne({ // Payslip model is removed
            where: { id: payslipId, tenantId },
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'job_title'] // Add more as needed for payslip display
                },
                {
                    model: PayrollRun,
                    as: 'payrollRun',
                    attributes: ['id', 'periodStart', 'periodEnd', 'paymentDate']
                },
                {
                    model: PayslipItem,
                    as: 'payslipItems',
                    attributes: ['id', 'description', 'type', 'amount'], // Fields from PayslipItem itself
                    include: [{
                        model: SalaryComponent,
                        as: 'salaryComponent', // Alias from PayslipItem association
                        attributes: ['id', 'name', 'type', 'category', 'component_code', 'payslip_display_order']
                    }],
                    // Order items within the payslip, e.g., by display order then by creation
                    order: [
                        // Order by payslip_display_order on the SalaryComponent, then by type (earnings before deductions)
                        // Handling NULLS LAST for display order is important for custom items without an order
                        [sequelize.literal('"payslipItems->salaryComponent"."payslip_display_order" ASC NULLS LAST')],
                        ['type', 'ASC'], // 'earning' before 'deduction', 'tax', etc.
                        ['createdAt', 'ASC']
                    ]
                }
            ]
        });

        // ADD LOGGING BLOCK HERE:
        if (payslip) {
            console.log(`[API GET /api/payslips/:payslipId] Fetched payslip object (raw):`, payslip); // Log raw Sequelize object
            try {
                console.log(`[API GET /api/payslips/:payslipId] Fetched payslip object (toJSON):`, payslip.toJSON());
            } catch (e) {
                console.error(`[API GET /api/payslips/:payslipId] Error calling toJSON() on payslip object:`, e);
            }

            if (payslip.payslipItems && Array.isArray(payslip.payslipItems)) {
                console.log(`[API GET /api/payslips/:payslipId] payslip.payslipItems is DEFINED on server. Length: ${payslip.payslipItems.length}`);
                payslip.payslipItems.forEach((item, index) => {
                    try {
                        console.log(`[API GET /api/payslips/:payslipId] Item ${index} (toJSON):`, item.toJSON());
                    } catch(e) {
                         console.error(`[API GET /api/payslips/:payslipId] Error calling toJSON() on item ${index}:`, e);
                         console.log(`[API GET /api/payslips/:payslipId] Item ${index} (raw):`, item);
                    }
                });
            } else if (payslip.payslipItems) {
                console.log(`[API GET /api/payslips/:payslipId] payslip.payslipItems is DEFINED but NOT AN ARRAY. Value:`, payslip.payslipItems);
            } else {
                console.log(`[API GET /api/payslips/:payslipId] payslip.payslipItems is UNDEFINED or NULL on server, but payslip object exists.`);
            }
        } else {
            console.log(`[API GET /api/payslips/:payslipId] Payslip object itself is null/undefined on server for ID: ${payslipId}`);
        }

        if (!payslip) {
            return res.status(404).json({ error: 'Payslip not found or access denied.' });
        }
        res.json(payslip);
    } catch (error) {
        console.error(`Error fetching payslip ${req.params.payslipId}:`, error);
        res.status(500).json({ error: 'Failed to fetch payslip.' });
    }
});

// GET all payslips for a specific employee
app.get('/api/employees/:employeeId/payslips', authenticateAndAttachUser, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { employeeId } = req.params;

        // if (!validator.isUUID(employeeId)) { // validator is removed
        //     return res.status(400).json({ error: 'Invalid employee ID format. Please provide a valid UUID.' });
        // }

        // Verify employee exists and belongs to the tenant
        const employee = await Employee.findOne({ where: { id: employeeId, tenantId } }); // Employee model is removed
        if (!employee) {
            // As per your test expectation for non-existent employee but valid UUID:
            // return res.status(404).json({ error: 'Employee not found or access denied.' });
            return res.json([]); // Return empty array if employee not found (test expects 200 with empty array)
        }

        const payslips = await Payslip.findAll({
            where: { employeeId, tenantId },
            include: [
                {
                    model: PayrollRun,
                    as: 'payrollRun', // From Payslip.belongsTo(PayrollRun, { as: 'payrollRun' })
                    attributes: ['id', 'periodEnd', 'paymentDate', 'status'] // Added status for context
                }
                // For a list view, you might not need all PayslipItems immediately.
                // If you do, add the PayslipItem include here as well.
            ],
            order: [
                // Order by payrollRun's periodEnd descending (most recent first)
                // This requires the include to be set up correctly.
                // The syntax for ordering by an included model's field can be tricky:
                [ { model: PayrollRun, as: 'payrollRun' }, 'periodEnd', 'DESC' ],
                ['createdAt', 'DESC'] // Fallback ordering
            ]
        });

        res.json(payslips);
    } catch (error) {
        console.error(`Error fetching payslips for employee ${req.params.employeeId}:`, error);
        res.status(500).json({ error: 'Failed to fetch employee payslips.' });
    }
});

// --- Start the Server ---
const startServer = async () => {
  try {
    // This check ensures the server only starts when you run `node server.js`
    // and not when it's `require`d by a test file.
    if (require.main === module) {
        try {
            await sequelize.authenticate();
            console.log('✅ Database connection is successful.');

            app.listen(PORT, () => {
                console.log(`🚀 Server is listening on http://localhost:${PORT}`);
            });
        } catch (error) {
            console.error('❌ Unable to start server:', error);
            process.exit(1);
        }
    }
};

startServer();

// Export the app for testing purposes
module.exports = app;