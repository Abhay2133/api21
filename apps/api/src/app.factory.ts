import { createApp } from './app.js';
import { databaseService } from './core/database/database.service.js';
import { redisService } from './core/redis/redis.service.js';
import { bullMQService } from './core/bullmq/bullmq.service.js';

export { createApp };

// Compatibility adapter for existing test suites
export const createNestApp = async () => {
  const expressApp = createApp();

  return {
    getHttpServer: () => expressApp,
    init: async () => {
      await databaseService.init();
      redisService.initClient();
    },
    close: async () => {
      await databaseService.close();
      await redisService.close();
      await bullMQService.closeAllQueuesAndWorkers(1000);
    },
  };
};
