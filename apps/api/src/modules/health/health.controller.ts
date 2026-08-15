import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DatabaseService } from '../../core/database/database.service.js';
import { RedisService } from '../../core/redis/redis.service.js';
import { BullMQService } from '../../core/bullmq/bullmq.service.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly bullmqService: BullMQService
  ) {}

  @Get()
  async getHealth(@Res() res: Response) {
    const [dbHealthy, redisHealthy, queueHealthy] = await Promise.all([
      this.databaseService.checkHealth(),
      this.redisService.checkHealth(),
      this.bullmqService.checkHealth(),
    ]);

    const isHealthy = dbHealthy; // DB is critical, Redis & Queue warning only
    const statusCode = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(statusCode).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
        bullmq: queueHealthy ? 'connected' : 'disconnected',
      },
    });
  }
}
