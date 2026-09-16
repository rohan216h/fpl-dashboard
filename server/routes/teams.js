const express = require('express');
const prisma = require('../prismaClient');

const router = express.Router();

// GET /api/teams
router.get('/', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

module.exports = router;
