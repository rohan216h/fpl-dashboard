const express = require('express');
const prisma = require('../prismaClient');

const router = express.Router();

// GET /api/fixtures?gameweek=5
router.get('/', async (req, res) => {
  try {
    const { gameweek } = req.query;
    const where = {};
    if (gameweek) where.gameweekId = parseInt(gameweek, 10);

    const fixtures = await prisma.fixture.findMany({
      where,
      orderBy: { kickoffTime: 'asc' },
    });
    res.json(fixtures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

module.exports = router;
