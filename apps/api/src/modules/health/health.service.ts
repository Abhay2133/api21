import { HealthResponse } from '@api21/types';
import { healthModel, HealthModel } from './health.model.js';
import { config } from '../../config/env.js';

export class HealthService {
  constructor(private readonly model: HealthModel = healthModel) {}

  async getHealth(): Promise<HealthResponse> {
    const [dbHealthy, redisHealthy, bullmqHealthy] = await Promise.all([
      this.model.checkDatabase(),
      this.model.checkRedis(),
      this.model.checkBullMQ(),
    ]);

    const isHealthy = dbHealthy && redisHealthy && bullmqHealthy;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
        bullmq: bullmqHealthy ? 'connected' : 'disconnected',
      },
    };
  }
}

export const healthService = new HealthService();
