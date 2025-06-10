require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // We only need sequelize to test connection here
const { Op } = require('sequelize');

// CORRECTED: Import ALL models you'll need for your routes
const { User, Role, Employee, Department, SalaryComponent } = require('./models');

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
    delete user_data.password_hash; // Ensure you are deleting password_hash if that's the field name

    res.json({
      message: 'Login successful!',
      user: user_data,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});


// --- ADD THE EMPLOYEES ROUTE AND ITS FAKE MIDDLEWARE HERE ---

// FAKE Authentication Middleware (replace with real JWT logic later)
const authenticateAndAttachUser = async (req, res, next) => {
    try {
        // Simulating a logged-in user from TechSolutions SARL
        // In a real app, you'd verify a JWT and find the user by ID from the token
        const loggedInUser = await User.findOne({ 
            where: { email: 'manager.rh@techsolutions.ma' } // User for testing
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
            where: {
                tenantId: tenantId
            },
            include: [
                { 
                    model: Department, 
                    as: 'department' // Ensure this alias matches your Employee model association
                }
            ]
        });

        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// SALARY COMPONENTS ROUTES
// GET all salary components (system-defined and tenant-specific)
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
            order: [
                ['is_system_defined', 'DESC'],
                ['name', 'ASC']
            ]
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
        const { name, description, type, default_amount, is_taxable, payslip_display_order } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required.' });
        }
        if (!['earning', 'deduction'].includes(type)) {
            return res.status(400).json({ error: "Type must be 'earning' or 'deduction'." });
        }

        const newSalaryComponent = await SalaryComponent.create({
            tenantId,
            name,
            description,
            type,
            calculation_type: 'fixed',
            amount: default_amount ? parseFloat(default_amount) : null,
            is_taxable: !!is_taxable,
            is_system_defined: false,
            is_active: true,
            payslip_display_order: payslip_display_order ? parseInt(payslip_display_order, 10) : null
        });

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
        const { name, description, type, default_amount, is_taxable, is_active, payslip_display_order } = req.body;

        const component = await SalaryComponent.findOne({
            where: {
                id: componentId,
                tenantId: tenantId,
                is_system_defined: false
            }
        });

        if (!component) {
            return res.status(404).json({ error: 'Custom salary component not found or access denied.' });
        }

        if (name) {
            component.name = name;
        }
        if (description !== undefined) {
            component.description = description;
        }
        if (type) {
            if (!['earning', 'deduction'].includes(type)) {
                return res.status(400).json({ error: "Invalid type. Must be 'earning' or 'deduction'." });
            }
            component.type = type;
        }
        if (default_amount !== undefined) {
            component.amount = default_amount ? parseFloat(default_amount) : null;
        }
        if (is_taxable !== undefined) {
            component.is_taxable = !!is_taxable;
        }
        if (is_active !== undefined) {
            component.is_active = !!is_active;
        }
        if (payslip_display_order !== undefined) {
            component.payslip_display_order = payslip_display_order ? parseInt(payslip_display_order, 10) : null;
        }

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