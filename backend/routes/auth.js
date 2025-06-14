// --- START OF UPDATED FILE ---
// ---
// backend/routes/auth.js
// ---
const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  // Note: Registration is not used by the current frontend flow, but the route is here.
  // In a real app, you would have a tenant creation/invitation flow instead of public registration.
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    // This registration logic needs to be adapted for a multi-tenant system
    // (e.g., assigning to a tenant). It is not the primary focus right now.
    return res.status(501).json({ msg: 'Public registration is not implemented. Please use seeded users.' });
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // FIX: Use the 'withPassword' scope to include the passwordHash field
      let user = await User.scope('withPassword').findOne({ where: { email } });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      // FIX: Compare with the correct 'passwordHash' field from the model
      const isMatch = await bcrypt.compare(password, user.passwordHash);

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const payload = {
        user: {
          id: user.id,
          tenantId: user.tenantId, // Include tenantId in the token
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000 }, // e.g., 100 hours
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;