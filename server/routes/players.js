const express = require('express');
const prisma = require('../prismaClient');

const router = express.Router();

// GET /api/players?position=MID&team=3
router.get('/', async (req, res) => {
  try {
    const { position, team } = req.query;
    const where = {};
    if (position) where.position = position;
    if (team) where.teamId = parseInt(team, 10);

    const players = await prisma.player.findMany({
      where,
      include: { team: true },
      orderBy: { totalPoints: 'desc' },
    });
    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// GET /api/players/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        team: true,
        stats: { orderBy: { gameweekId: 'asc' } },
      },
    });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// GET /api/players/compare?ids=1,2,3
router.get('/compare/list', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ error: 'ids query param required' });
    const idList = ids.split(',').map((n) => parseInt(n, 10));

    const players = await prisma.player.findMany({
      where: { id: { in: idList } },
      include: {
        team: true,
        stats: { orderBy: { gameweekId: 'asc' } },
      },
    });
    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compare players' });
  }
});

module.exports = router;
