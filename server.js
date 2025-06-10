require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // We only need sequelize to test connection here

// CORRECTED: Import ALL models you'll need for your routes
const { User, Role, Employee, Department } = require('./models'); 

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
    // Removed the logic to start server if DB fails for this example
    // In production, you might want the server to fail if DB is down
  }
};

startServer();