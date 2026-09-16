const express = require('express');
const axios = require('axios');
const prisma = require('../prismaClient');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const FPL_BASE = 'https://fantasy.premierleague.com/api';

// GET /api/my-squad (authenticated)
router.get('/my-squad', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !user.fplTeamId) {
      return res.status(400).json({ error: 'No FPL team linked to this account' });
    }

    // Find the current gameweek (first not-finished one; fallback to latest finished)
    const gameweeks = await prisma.gameweek.findMany({ orderBy: { id: 'asc' } });
    let currentGw =
      gameweeks.find((gw) => !gw.finished) || gameweeks[gameweeks.length - 1];

    // FPL only publishes picks for a gameweek AFTER its deadline passes.
    // If the "current" (not yet finished) gameweek's picks aren't available yet (404),
    // fall back to the most recent gameweek marked finished.
    let picksData;
    try {
      const res = await axios.get(
        `${FPL_BASE}/entry/${user.fplTeamId}/event/${currentGw.id}/picks/`
      );
      picksData = res.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        const finishedGws = gameweeks.filter((gw) => gw.finished);
        const fallbackGw = finishedGws[finishedGws.length - 1];
        if (!fallbackGw) throw err; // no finished gameweeks at all, nothing to show
        currentGw = fallbackGw;
        const res = await axios.get(
          `${FPL_BASE}/entry/${user.fplTeamId}/event/${currentGw.id}/picks/`
        );
        picksData = res.data;
      } else {
        throw err;
      }
    }

    const playerIds = picksData.picks.map((p) => p.element);

    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      include: { team: true },
    });

    // Merge picks metadata (is_captain, multiplier, position in squad) with full player stats
    const squad = picksData.picks.map((pick) => {
      const player = players.find((p) => p.id === pick.element);
      return {
        ...pick,
        player,
      };
    });

    res.json({
      gameweek: currentGw.id,
      entryHistory: picksData.entry_history,
      squad,
    });
  } catch (err) {
    console.error(err);
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: 'FPL team ID not found' });
    }
    res.status(500).json({ error: 'Failed to fetch squad' });
  }
});

// GET /api/fixtures/difficulty?teamId=3&nextN=5
router.get('/fixtures/difficulty', async (req, res) => {
  try {
    const { teamId, nextN } = req.query;
    if (!teamId) return res.status(400).json({ error: 'teamId query param required' });

    const n = parseInt(nextN, 10) || 5;
    const teamIdInt = parseInt(teamId, 10);

    // Find current/next gameweek to anchor "upcoming"
    const gameweeks = await prisma.gameweek.findMany({ orderBy: { id: 'asc' } });
    const currentGw = gameweeks.find((gw) => !gw.finished) || gameweeks[0];

    const fixtures = await prisma.fixture.findMany({
      where: {
        gameweekId: { gte: currentGw.id },
        OR: [{ homeTeamId: teamIdInt }, { awayTeamId: teamIdInt }],
      },
      orderBy: { gameweekId: 'asc' },
      take: n,
    });

    const result = fixtures.map((f) => {
      const isHome = f.homeTeamId === teamIdInt;
      return {
        gameweekId: f.gameweekId,
        opponent: isHome ? f.awayTeamId : f.homeTeamId,
        isHome,
        difficulty: isHome ? f.homeDifficulty : f.awayDifficulty,
        kickoffTime: f.kickoffTime,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fixture difficulty' });
  }
});

// GET /api/suggestions (authenticated)
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !user.fplTeamId) {
      return res.status(400).json({ error: 'No FPL team linked to this account' });
    }

    const gameweeks = await prisma.gameweek.findMany({ orderBy: { id: 'asc' } });
    let currentGw = gameweeks.find((gw) => !gw.finished) || gameweeks[gameweeks.length - 1];

    // Get user's current squad player IDs (fallback to last finished GW if picks not published yet)
    let picksData;
    try {
      const res = await axios.get(
        `${FPL_BASE}/entry/${user.fplTeamId}/event/${currentGw.id}/picks/`
      );
      picksData = res.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        const finishedGws = gameweeks.filter((gw) => gw.finished);
        const fallbackGw = finishedGws[finishedGws.length - 1];
        if (!fallbackGw) throw err;
        currentGw = fallbackGw;
        const res = await axios.get(
          `${FPL_BASE}/entry/${user.fplTeamId}/event/${currentGw.id}/picks/`
        );
        picksData = res.data;
      } else {
        throw err;
      }
    }
    const ownedIds = picksData.picks.map((p) => p.element);

    // All players not in squad
    const candidates = await prisma.player.findMany({
      where: { id: { notIn: ownedIds } },
      include: { team: true },
    });

    // Get all fixtures for next 5 gameweeks to compute average difficulty per team
    const upcomingFixtures = await prisma.fixture.findMany({
      where: { gameweekId: { gte: currentGw.id, lt: currentGw.id + 5 } },
    });

    function avgDifficultyForTeam(teamId) {
      const relevant = upcomingFixtures.filter(
        (f) => f.homeTeamId === teamId || f.awayTeamId === teamId
      );
      if (relevant.length === 0) return 3; // neutral default
      const total = relevant.reduce((sum, f) => {
        return sum + (f.homeTeamId === teamId ? f.homeDifficulty : f.awayDifficulty);
      }, 0);
      return total / relevant.length;
    }

    // Normalize form across candidates (simple min-max)
    const forms = candidates.map((p) => p.form);
    const maxForm = Math.max(...forms, 1);
    const minForm = Math.min(...forms, 0);

    function normalizedForm(form) {
      if (maxForm === minForm) return 0.5;
      return (form - minForm) / (maxForm - minForm);
    }

    const scored = candidates.map((p) => {
      const avgDiff = avgDifficultyForTeam(p.teamId);
      // easier fixtures = lower avgDiff (FPL scale 1-5) => invert to 0-1 where 1 is easiest
      const fixtureEase = (5 - avgDiff) / 4;
      const score = normalizedForm(p.form) * 0.6 + fixtureEase * 0.4;
      return { ...p, avgUpcomingDifficulty: avgDiff, score };
    });

    const byPosition = {};
    for (const p of scored) {
      if (!byPosition[p.position]) byPosition[p.position] = [];
      byPosition[p.position].push(p);
    }

    const suggestions = {};
    for (const pos of Object.keys(byPosition)) {
      suggestions[pos] = byPosition[pos]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((p) => ({
          id: p.id,
          webName: p.webName,
          team: p.team.shortName,
          form: p.form,
          avgUpcomingDifficulty: Number(p.avgUpcomingDifficulty.toFixed(2)),
          score: Number(p.score.toFixed(3)),
        }));
    }

    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

module.exports = router;
