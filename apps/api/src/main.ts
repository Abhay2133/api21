import { createApp } from './app.js';
import { config } from './config/env.js';
import { databaseService } from './core/database/database.service.js';
import { redisService } from './core/redis/redis.service.js';
import { bullMQService } from './core/bullmq/bullmq.service.js';
import http from 'http';

async function bootstrap() {
  // 1. Initialize Database & Migrations
  await databaseService.init();

  // 2. Initialize Redis client
  redisService.initClient();

  // 3. Build Express Application
  const app = createApp();

  // 4. Create HTTP server and start listening
  const server = http.createServer(app);
  server.listen(config.port, () => {
    console.log(`[Server] api21 backend running on http://localhost:${config.port} in ${config.nodeEnv} mode.`);
  });

  // 5. Graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      await bullMQService.closeAllQueuesAndWorkers(5000);
      await redisService.close();
      await databaseService.close();
      console.log('[Server] Graceful shutdown completed.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[Server] Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Server] Bootstrap failed:', err);
  process.exit(1);
});
