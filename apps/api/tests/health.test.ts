import request from 'supertest';
import { createApp } from '../src/app.js';
import { databaseService, DatabaseService } from '../src/core/database/database.service.js';
import { redisService, RedisService } from '../src/core/redis/redis.service.js';
import { bullMQService, BullMQService } from '../src/core/bullmq/bullmq.service.js';
import { Express } from 'express';

describe('Health Endpoint', () => {
  let app: Express;

  beforeAll(async () => {
    jest.spyOn(DatabaseService.prototype, 'checkHealth').mockResolvedValue(true);
    jest.spyOn(DatabaseService.prototype, 'init').mockResolvedValue(undefined as any);
    jest.spyOn(RedisService.prototype, 'checkHealth').mockResolvedValue(true);
    jest.spyOn(BullMQService.prototype, 'checkHealth').mockResolvedValue(true);

    app = createApp();
  });

  afterAll(async () => {
    await databaseService.close();
    await redisService.close();
    await bullMQService.closeAllQueuesAndWorkers(500);
  });

  it('GET /api/v1/health should return status 200 and healthy details', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.services).toEqual({
      database: 'connected',
      redis: 'connected',
      bullmq: 'connected',
    });
  });
});
