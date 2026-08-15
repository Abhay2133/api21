import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/app.factory.js';
import { DatabaseService } from '../src/core/database/database.service.js';
import { RedisService } from '../src/core/redis/redis.service.js';
import { BullMQService } from '../src/core/bullmq/bullmq.service.js';

describe('Health Endpoint', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    jest.spyOn(DatabaseService.prototype, 'checkHealth').mockResolvedValue(true);
    jest.spyOn(DatabaseService.prototype, 'onModuleInit').mockResolvedValue(undefined as any);
    jest.spyOn(RedisService.prototype, 'checkHealth').mockResolvedValue(true);
    jest.spyOn(BullMQService.prototype, 'checkHealth').mockResolvedValue(true);

    app = await createNestApp();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /api/v1/health should return status 200 and healthy details', async () => {
    const res = await request(httpServer).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.services).toEqual({
      database: 'connected',
      redis: 'connected',
      bullmq: 'connected',
    });
  });
});
