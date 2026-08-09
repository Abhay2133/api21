import { initDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';
import { closeAllQueuesAndWorkers } from './config/bullmq.js';
import { initSampleWorker } from './queues/sampleQueue.js';

const startWorker = async () => {
  try {
    console.log('[Worker] Initializing standalone BullMQ worker process...');
    await initDatabase();
    initRedis();

    const worker = initSampleWorker();
    console.log(`[Worker] BullMQ worker process active for queue: "${worker.name}".`);

    const shutdown = async () => {
      console.log('[Worker] Gracefully shutting down worker process...');
      await closeAllQueuesAndWorkers(5000);
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
