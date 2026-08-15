import { databaseService } from '../../core/database/database.service.js';
import { redisService } from '../../core/redis/redis.service.js';
import { bullMQService } from '../../core/bullmq/bullmq.service.js';

export class HealthModel {
  async checkDatabase(): Promise<boolean> {
    return databaseService.checkHealth();
  }

  async checkRedis(): Promise<boolean> {
    return redisService.checkHealth();
  }

  async checkBullMQ(): Promise<boolean> {
    return bullMQService.checkHealth();
  }
}

export const healthModel = new HealthModel();
