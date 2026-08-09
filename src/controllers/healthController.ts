import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database.js';
import { checkRedisHealth } from '../config/redis.js';
import { checkQueueHealth } from '../config/bullmq.js';


export const getHealth = async (req: Request, res: Response) => {
  const dbHealthy = await checkDatabaseHealth();
  const redisHealthy = await checkRedisHealth();
  const queueHealthy = await checkQueueHealth();

  const isHealthy = dbHealthy; // DB is critical, Redis & Queue warning only

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected',
      bullmq: queueHealthy ? 'connected' : 'disconnected',
    },
  });
};

