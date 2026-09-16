const cron = require('node-cron');
const { syncFplData } = require('../scripts/syncFplData');

function startScheduler() {
  // Runs at minute 0 of every 6th hour: 00:00, 06:00, 12:00, 18:00
  cron.schedule('0 */6 * * *', async () => {
    console.log('Running scheduled FPL data sync...');
    try {
      await syncFplData();
    } catch (err) {
      console.error('Scheduled sync failed:', err);
    }
  });

  console.log('FPL data sync scheduler started (every 6 hours).');
}

module.exports = { startScheduler };
