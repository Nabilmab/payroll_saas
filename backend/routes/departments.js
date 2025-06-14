// backend/routes/departments.js

import express from 'express';
import prisma from '../lib/prisma.js'; // <-- Import Prisma client
import { check, validationResult } from 'express-validator';

const router = express.Router();

// GET /api/departments
// Get all departments for the authenticated user's tenant
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.user; // Comes from your auth middleware

    const departments = await prisma.department.findMany({
      where: {
        tenantId: tenantId, // Filter by the user's tenant
      },
      orderBy: {
        name: 'asc', // Order by name ascending
      },
    });

    res.json(departments);
  } catch (err) {
    console.error('Error fetching departments:', err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/departments
// Create a new department for the authenticated user's tenant
router.post(
  '/',
  [check('name', 'Department name is required').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tenantId } = req.user;
    const { name, description } = req.body;

    try {
      const newDepartment = await prisma.department.create({
        data: {
          name,
          description: description || null,
          tenantId: tenantId, // Connect to the user's tenant
        },
      });

      res.status(201).json(newDepartment);
    } catch (err) {
      // Prisma has specific error codes for constraints
      if (err.code === 'P2002') { // Unique constraint violation
        return res.status(409).json({ msg: 'A department with this name already exists.' });
      }
      console.error('Error creating department:', err.message);
      res.status(500).send('Server Error');
    }
  }
);

export default router;