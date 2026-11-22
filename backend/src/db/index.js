const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('../config');

let dbDriver = null;
let isPgMem = false;

// Initialize Database connection
async function initDb() {
  if (dbDriver) return dbDriver;

  const schemaPath = path.join(__dirname, 'schema.sql');
  const rawSchemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Try PostgreSQL connection first
  try {
    const pool = new Pool({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 3000
    });

    // Test query
    const client = await pool.connect();
    console.log('✓ Successfully connected to PostgreSQL Database at:', config.databaseUrl.replace(/:[^:]*@/, ':****@'));
    
    // Run schema migrations
    await client.query(rawSchemaSql);
    client.release();

    dbDriver = {
      isPgMem: false,
      query: (text, params) => pool.query(text, params),
      pool
    };
    return dbDriver;
  } catch (err) {
    console.warn('⚠️  PostgreSQL connection unavailable (' + (err.message || 'connection failed') + ').');
    console.log('⚡ Initializing in-memory PostgreSQL engine (pg-mem) for standalone execution...');

    const { newDb } = require('pg-mem');
    const memDb = newDb();

    // Register pg functions if needed
    memDb.public.registerFunction({
      name: 'now',
      implementation: () => new Date()
    });

    // Strip SQL comments and execute schema statements
    const cleanedSql = rawSchemaSql.replace(/--.*$/gm, '');
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        memDb.public.none(stmt);
      } catch (e) {
        console.warn('pg-mem statement notice:', e.message);
      }
    }

    const adapter = memDb.adapters.createPg();
    const memPool = new adapter.Pool();
    isPgMem = true;

    dbDriver = {
      isPgMem: true,
      query: (text, params = []) => memPool.query(text, params),
      pool: memPool
    };

    console.log('✓ PostgreSQL in-memory engine ready and schema initialized.');
    return dbDriver;
  }
}

// Proxy wrapper so any module can directly import and call db.query()
const db = {
  query: async (text, params) => {
    if (!dbDriver) {
      await initDb();
    }
    return dbDriver.query(text, params);
  },
  initDb,
  isPgMem: () => isPgMem
};

module.exports = db;
