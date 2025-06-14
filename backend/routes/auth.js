// backend/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    // ... validation ...

    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      // --- START OF DEBUGGING ---
      console.log('--- LOGIN ATTEMPT ---');
      console.log('User found in DB:', user); // See if the user and passwordHash are retrieved
      // --- END OF DEBUGGING ---

      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);

      // --- START OF DEBUGGING ---
      console.log('Password match result:', isMatch); // See if bcrypt comparison is true or false
      // --- END OF DEBUGGING ---

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      // ... (rest of the function)
      const payload = { user: { id: user.id, tenantId: user.tenantId } };
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

export default router;