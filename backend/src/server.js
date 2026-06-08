require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./db/pool');
const { runMigrations } = require('./db/migrate');

const PORT = process.env.PORT || 5000;

async function start() {
  await testConnection();
  await runMigrations();
  app.listen(PORT, () => {
    // Never log sensitive config values here
    console.log(`[server] Running on port ${PORT}`);
    console.log(`[server] Docs available at http://localhost:${PORT}/api/docs`);
  });
}

start().catch((err) => {
  // Log message only — never the full error object which may contain connection strings
  console.error('[server] Failed to start:', err.message);
  process.exit(1);
});
