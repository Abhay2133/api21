import request from 'supertest';
import { createApp } from '../src/app.js';
import { config } from '../src/config/env.js';
import { databaseService, DatabaseService } from '../src/core/database/database.service.js';
import { redisService } from '../src/core/redis/redis.service.js';
import { bullMQService } from '../src/core/bullmq/bullmq.service.js';
import { Express } from 'express';

describe('Deploy Webhook Endpoint', () => {
  let app: Express;
  const mockQuery = jest.fn().mockResolvedValue({ rows: [] });

  beforeAll(async () => {
    jest.spyOn(DatabaseService.prototype, 'init').mockResolvedValue(undefined as any);
    jest.spyOn(DatabaseService.prototype, 'query').mockImplementation((...args: any[]) => mockQuery(...args));

    app = createApp();
  });

  beforeEach(() => {
    mockQuery.mockClear();
  });

  afterAll(async () => {
    await databaseService.close();
    await redisService.close();
    await bullMQService.closeAllQueuesAndWorkers(500);
  });

  it('POST /api/v1/webhooks/deploy with invalid token should return 401', async () => {
    const res = await request(app).post('/api/v1/webhooks/deploy?token=wrong-token');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Unauthorized');
  });

  it('POST /api/v1/webhooks/deploy with valid token should return 202 and trigger deploy process', async () => {
    const validToken = config.deployCiToken;
    const res = await request(app).post(`/api/v1/webhooks/deploy?token=${validToken}`);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('success');
    expect(res.body.deployment_id).toBeDefined();
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});
