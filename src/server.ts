import { createApp } from './app.js';
import { config } from './config/env.js';
import { initDatabase } from './infrastructure/database.js';
import { initRedis } from './infrastructure/redis.js';
import { startPingWorker } from './services/pingService.js';

const startServer = async () => {
  try {
    // Initialize infrastructure
    await initDatabase();
    initRedis();

    // Start background ping worker if configured
    startPingWorker();

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`[Server] Express TS server running at http://localhost:${config.port} in ${config.env} mode`);
    });

    const shutdown = async () => {
      console.log('[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[Server] Fatal error starting server:', err);
    process.exit(1);
  }
};

startServer();
