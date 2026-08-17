import './instrument.js';
import { databaseService } from './core/database/database.service.js';
import { redisService } from './core/redis/redis.service.js';
import { bullMQService } from './core/bullmq/bullmq.service.js';
import { initSampleWorker } from './modules/jobs/jobs.job.js';
import { initMaintenanceWorker, scheduleNightlyPm2Restart } from './modules/jobs/maintenance.job.js';

const startWorker = async () => {
  try {
    console.log('[Worker] Initializing standalone BullMQ worker process...');

    await databaseService.init();
    redisService.initClient();

    const sampleWorker = initSampleWorker(bullMQService);
    const maintenanceWorker = initMaintenanceWorker(bullMQService);
    await scheduleNightlyPm2Restart();

    console.log(
      `[Worker] BullMQ workers active: ["${sampleWorker.name}", "${maintenanceWorker.name}"].`
    );

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
