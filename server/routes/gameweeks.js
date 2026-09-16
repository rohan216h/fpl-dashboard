const express = require('express');
const prisma = require('../prismaClient');

const router = express.Router();

// GET /api/gameweeks
router.get('/', async (req, res) => {
  try {
    const gameweeks = await prisma.gameweek.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(gameweeks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch gameweeks' });
  }
});

module.exports = router;
