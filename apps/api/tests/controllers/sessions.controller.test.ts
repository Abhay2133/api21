import request from 'supertest';
import { createApp } from '../../src/app.js';
import { databaseService, DatabaseService } from '../../src/core/database/database.service.js';
import { redisService } from '../../src/core/redis/redis.service.js';
import { bullMQService } from '../../src/core/bullmq/bullmq.service.js';
import { Express } from 'express';

describe('Sessions Controller - Integration Tests', () => {
  let app: Express;
  const mockQuery = jest.fn();

  beforeAll(async () => {
    jest.spyOn(DatabaseService.prototype, 'init').mockResolvedValue(undefined as any);
    jest.spyOn(DatabaseService.prototype, 'query').mockImplementation((...args: any[]) => mockQuery(...args));

    app = createApp();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  afterAll(async () => {
    await databaseService.close();
    await redisService.close();
    await bullMQService.closeAllQueuesAndWorkers(500);
  });

  it('POST /api/v1/sessions creates a new user session', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          token: 'generated_session_token_123',
          username: 'tester',
          ip_address: '::ffff:127.0.0.1',
          user_agent: 'Supertest',
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
    });

    const res = await request(app)
      .post('/api/v1/sessions')
      .send({ username: 'tester' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBe('generated_session_token_123');
  });

  it('POST /api/v1/sessions without username returns 400', async () => {
    const res = await request(app).post('/api/v1/sessions').send({});
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('GET /api/v1/sessions returns list of active sessions', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 1, token: 'tok_1', username: 'alice', is_active: true },
        { id: 2, token: 'tok_2', username: 'bob', is_active: true },
      ],
    });

    const res = await request(app).get('/api/v1/sessions?username=alice');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
  });

  it('DELETE /api/v1/sessions/token/:token revokes session by token', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app).delete('/api/v1/sessions/token/tok_1');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.success).toBe(true);
  });

  it('DELETE /api/v1/sessions/:id revokes session by numeric ID', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app).delete('/api/v1/sessions/15');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.success).toBe(true);
  });
});
