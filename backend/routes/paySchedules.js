// backend/routes/paySchedules.js
import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { tenantId } = req.user;
  try {
    const schedules = await prisma.paySchedule.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(schedules);
  } catch (err) {
    console.error('Error fetching pay schedules:', err.message);
    res.status(500).send('Server Error');
  }
});

export default router;