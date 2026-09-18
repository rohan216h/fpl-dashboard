const express = require('express');
const cors = require('cors');
require('dotenv').config();

const playersRouter = require('./routes/players');
const teamsRouter = require('./routes/teams');
const fixturesRouter = require('./routes/fixtures');
const gameweeksRouter = require('./routes/gameweeks');
const authRouter = require('./routes/auth');
const featuresRouter = require('./routes/features');
const { startScheduler } = require('./jobs/scheduler');
const { syncFplData } = require('./scripts/syncFplData');

const app = express();

const allowedOrigins = [
  'http://localhost:5173', // local dev
  'https://fpl-dashboard-97amon91w-rtc-9f10.vercel.app', // deployed frontend
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/players', playersRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/fixtures', fixturesRouter);
app.use('/api/gameweeks', gameweeksRouter);
app.use('/api/auth', authRouter);
app.use('/api', featuresRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startScheduler();

  syncFplData().catch((err) => {
    console.error('Initial startup sync failed:', err);
  });
});