import { databaseService } from './core/database/database.service.js';
import { redisService } from './core/redis/redis.service.js';
import { bullMQService } from './core/bullmq/bullmq.service.js';
import { initSampleWorker } from './modules/jobs/jobs.job.js';

const startWorker = async () => {
  try {
    console.log('[Worker] Initializing standalone BullMQ worker process...');

    await databaseService.init();
    redisService.initClient();

    const worker = initSampleWorker(bullMQService);
    console.log(`[Worker] BullMQ worker process active for queue: "${worker.name}".`);

    const shutdown = async (signal: string) => {
      console.log(`[Worker] Received ${signal}. Gracefully shutting down worker process...`);
      await bullMQService.closeAllQueuesAndWorkers(5000);
      await redisService.close();
      await databaseService.close();
      console.log('[Worker] Worker process terminated.');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[Worker] Fatal error starting worker process:', err);
    process.exit(1);
  }
};

startWorker();
