// --- File: backend/routes/departments.js ---
const express = require('express');
const router = express.Router();
const { Department } = require('../models');
const { check, validationResult } = require('express-validator');

router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const departments = await Department.findAll({
      where: { tenantId },
      order: [['name', 'ASC']],
    });
    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', [check('name', 'Department name is required').not().isEmpty()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { tenantId } = req.user;
    const { name, description } = req.body;
    try {
      const newDepartment = await Department.create({ tenantId, name, description: description || null });
      res.status(201).json(newDepartment);
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ msg: 'A department with this name already exists.' });
      }
      res.status(500).send('Server Error');
    }
});

module.exports = router;