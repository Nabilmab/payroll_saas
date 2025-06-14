// --- File: backend/routes/paySchedules.js ---
const express = require('express');
const router = express.Router();
const { PaySchedule } = require('../models');

router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const schedules = await PaySchedule.findAll({
      where: { tenantId, isActive: true },
      order: [['name', 'ASC']],
    });
    res.json(schedules);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;