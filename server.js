require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // We only need sequelize to test connection here
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Allows server to accept JSON in request body

// --- A simple test route ---
app.get('/', (req, res) => {
  res.send('<h1>Payroll SaaS API is running!</h1>');
});

const { User, Role } = require('./models');

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find the user by email, and use the 'withPassword' scope to include the hash
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' }); // User not found
    }

    // Use the instance method from the model to check the password
    const isPasswordValid = user.validPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' }); // Wrong password
    }

    // On successful login, you would typically generate a JWT (JSON Web Token)
    // and send it back to the client. For now, we'll just send success.

    // Don't send the password hash back to the client!
    const user_data = user.toJSON();
    delete user_data.password_hash;

    res.json({
      message: 'Login successful!',
      user: user_data,
      // In a real app: token: 'your_generated_jwt_here'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// --- Start the Server ---
const startServer = async () => {
  try {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection is successful.');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      // Continue starting the server even if DB connection fails for testing purposes
    }
    app.listen(PORT, () => {
      console.log(`🚀 Server is listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server (outer catch):', error);
  }
};

startServer();
