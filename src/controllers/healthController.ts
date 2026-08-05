import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../infrastructure/database.js';
import { checkRedisHealth } from '../infrastructure/redis.js';

export const getHealth = async (req: Request, res: Response) => {
  const dbHealthy = await checkDatabaseHealth();
  const redisHealthy = await checkRedisHealth();

  const isHealthy = dbHealthy; // DB is critical, Redis warning only

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected',
    },
  });
};
