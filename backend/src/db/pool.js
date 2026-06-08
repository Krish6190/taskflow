const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Safe connection test — never logs the connection string
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    console.log('[db] Connected to PostgreSQL');
  } catch (err) {
    // Only log message, not the error object (which may contain credentials)
    console.error('[db] Connection failed:', err.message);
    throw new Error('Database connection failed');
  } finally {
    if (client) client.release();
  }
}

module.exports = { pool, testConnection };
