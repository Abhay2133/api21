import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/app.factory.js';
import { config } from '../src/config/env.js';
import { DatabaseService } from '../src/core/database/database.service.js';

describe('Deploy Webhook Endpoint', () => {
  let app: INestApplication;
  let httpServer: any;
  const mockQuery = jest.fn().mockResolvedValue({ rows: [] });

  beforeAll(async () => {
    jest.spyOn(DatabaseService.prototype, 'onModuleInit').mockResolvedValue(undefined as any);
    jest.spyOn(DatabaseService.prototype, 'query').mockImplementation((...args: any[]) => mockQuery(...args));

    app = await createNestApp();
    await app.init();
    httpServer = app.getHttpServer();
  });

  beforeEach(() => {
    mockQuery.mockClear();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST /api/v1/webhooks/deploy with invalid token should return 401', async () => {
    const res = await request(httpServer).post('/api/v1/webhooks/deploy?token=wrong-token');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Unauthorized');
  });

  it('POST /api/v1/webhooks/deploy with valid token should return 202 and trigger deploy process', async () => {
    const validToken = config.deployCiToken;
    const res = await request(httpServer).post(`/api/v1/webhooks/deploy?token=${validToken}`);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('success');
    expect(res.body.deployment_id).toBeDefined();
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});
