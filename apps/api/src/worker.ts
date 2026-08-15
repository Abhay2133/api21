import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DatabaseService } from './core/database/database.service.js';
import { BullMQService } from './core/bullmq/bullmq.service.js';
import { initSampleWorker } from './modules/jobs/sample.queue.js';

const startWorker = async () => {
  try {
    console.log('[Worker] Initializing standalone BullMQ worker process via NestJS context...');
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn'],
    });
    app.enableShutdownHooks();

    const bullmqService = app.get(BullMQService);
    const worker = initSampleWorker(bullmqService);
    console.log(`[Worker] BullMQ worker process active for queue: "${worker.name}".`);

    const shutdown = async () => {
      console.log('[Worker] Gracefully shutting down worker process...');
      await app.close();
      console.log('[Worker] Worker process terminated.');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[Worker] Fatal error starting worker process:', err);
    process.exit(1);
  }
};

startWorker();
