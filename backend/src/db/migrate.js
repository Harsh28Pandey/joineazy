const db = require('./index');

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  await db.initDb();
  console.log('✓ Database migrations executed successfully.');
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
