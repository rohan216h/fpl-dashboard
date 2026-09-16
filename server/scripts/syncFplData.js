const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const FPL_BASE = 'https://fantasy.premierleague.com/api';

async function syncFplData() {
  console.log(`[${new Date().toISOString()}] Starting FPL data sync...`);

  const { data: bootstrap } = await axios.get(`${FPL_BASE}/bootstrap-static/`);

  console.log(`Upserting ${bootstrap.teams.length} teams...`);
  for (const t of bootstrap.teams) {
    await prisma.team.upsert({
      where: { id: t.id },
      update: { name: t.name, shortName: t.short_name },
      create: { id: t.id, name: t.name, shortName: t.short_name },
    });
  }

  console.log(`Upserting ${bootstrap.events.length} gameweeks...`);
  for (const e of bootstrap.events) {
    await prisma.gameweek.upsert({
      where: { id: e.id },
      update: {
        name: e.name,
        deadline: new Date(e.deadline_time),
        finished: e.finished,
      },
      create: {
        id: e.id,
        name: e.name,
        deadline: new Date(e.deadline_time),
        finished: e.finished,
      },
    });
  }

  const positionMap = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
  console.log(`Upserting ${bootstrap.elements.length} players...`);
  for (const p of bootstrap.elements) {
    await prisma.player.upsert({
      where: { id: p.id },
      update: {
        firstName: p.first_name,
        secondName: p.second_name,
        webName: p.web_name,
        teamId: p.team,
        position: positionMap[p.element_type] || 'UNK',
        nowCost: p.now_cost,
        totalPoints: p.total_points,
        form: parseFloat(p.form) || 0,
      },
      create: {
        id: p.id,
        firstName: p.first_name,
        secondName: p.second_name,
        webName: p.web_name,
        teamId: p.team,
        position: positionMap[p.element_type] || 'UNK',
        nowCost: p.now_cost,
        totalPoints: p.total_points,
        form: parseFloat(p.form) || 0,
      },
    });
  }

  const { data: fixtures } = await axios.get(`${FPL_BASE}/fixtures/`);
  console.log(`Upserting ${fixtures.length} fixtures...`);
  for (const f of fixtures) {
    if (!f.event) continue;
    await prisma.fixture.upsert({
      where: { id: f.id },
      update: {
        gameweekId: f.event,
        homeTeamId: f.team_h,
        awayTeamId: f.team_a,
        homeDifficulty: f.team_h_difficulty,
        awayDifficulty: f.team_a_difficulty,
        kickoffTime: f.kickoff_time ? new Date(f.kickoff_time) : null,
      },
      create: {
        id: f.id,
        gameweekId: f.event,
        homeTeamId: f.team_h,
        awayTeamId: f.team_a,
        homeDifficulty: f.team_h_difficulty,
        awayDifficulty: f.team_a_difficulty,
        kickoffTime: f.kickoff_time ? new Date(f.kickoff_time) : null,
      },
    });
  }

  const finishedGameweeks = bootstrap.events.filter((e) => e.finished);
  console.log(`Fetching per-player stats for ${finishedGameweeks.length} finished gameweeks...`);

  for (const gw of finishedGameweeks) {
    try {
      const { data: live } = await axios.get(`${FPL_BASE}/event/${gw.id}/live/`);
      for (const el of live.elements) {
        const s = el.stats;
        await prisma.playerGameweekStat.upsert({
          where: {
            playerId_gameweekId: { playerId: el.id, gameweekId: gw.id },
          },
          update: {
            points: s.total_points,
            minutes: s.minutes,
            goals: s.goals_scored,
            assists: s.assists,
          },
          create: {
            playerId: el.id,
            gameweekId: gw.id,
            points: s.total_points,
            minutes: s.minutes,
            goals: s.goals_scored,
            assists: s.assists,
          },
        });
      }
      console.log(`  Gameweek ${gw.id} done.`);
    } catch (err) {
      console.error(`  Failed gameweek ${gw.id}:`, err.message);
    }
  }

  console.log(`[${new Date().toISOString()}] FPL data sync complete.`);
}

// Allow running directly: node scripts/syncFplData.js
if (require.main === module) {
  syncFplData()
    .catch((err) => {
      console.error('Sync failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { syncFplData };
