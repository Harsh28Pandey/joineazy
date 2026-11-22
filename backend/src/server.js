const app = require('./app');
const config = require('./config');
const db = require('./db');
const { seedData } = require('./db/seed');

async function startServer() {
  try {
    console.log('🚀 Initializing Joineazy backend server...');
    
    // Initialize DB
    await db.initDb();

    // Auto-seed if database is empty
    await seedData();

    const server = app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🎓 Joineazy Backend Server running on port ${config.port}`);
      console.log(`📡 Health Check: http://localhost:${config.port}/api/health`);
      console.log(`⚡ Environment: ${config.nodeEnv}`);
      console.log(`======================================================\n`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Gracefully shutting down server...');
      server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Fatal Server Startup Error:', err);
    process.exit(1);
  }
}

startServer();
