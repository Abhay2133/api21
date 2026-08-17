import './instrument.js';
import { databaseService } from './core/database/database.service.js';
import { redisService } from './core/redis/redis.service.js';
import { bullMQService } from './core/bullmq/bullmq.service.js';
import { initSampleWorker } from './modules/jobs/jobs.job.js';
import { initMaintenanceWorker, scheduleNightlyPm2Restart } from './modules/jobs/maintenance.job.js';
import { logger } from './core/logger/logger.service.js';

const startWorker = async () => {
  try {
    logger.info('[Worker] Initializing standalone BullMQ worker process...');

    await databaseService.init();
    redisService.initClient();

    const sampleWorker = initSampleWorker(bullMQService);
    const maintenanceWorker = initMaintenanceWorker(bullMQService);
    await scheduleNightlyPm2Restart();

    logger.info(
      `[Worker] BullMQ workers active: ["${sampleWorker.name}", "${maintenanceWorker.name}"].`
    );

    const shutdown = async (signal: string) => {
      logger.info(`[Worker] Received ${signal}. Gracefully shutting down worker process...`);
      await bullMQService.closeAllQueuesAndWorkers(5000);
      await redisService.close();
      await databaseService.close();
      logger.info('[Worker] Worker process terminated.');
      await logger.flush();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error('[Worker] Fatal error starting worker process:', err);
    await logger.flush();
    process.exit(1);
  }
};

startWorker();
