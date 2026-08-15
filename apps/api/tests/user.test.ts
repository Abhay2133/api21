import request from 'supertest';
import { createApp } from '../src/app.js';
import { databaseService, DatabaseService } from '../src/core/database/database.service.js';
import { redisService } from '../src/core/redis/redis.service.js';
import { bullMQService } from '../src/core/bullmq/bullmq.service.js';
import { Express } from 'express';

describe('User Endpoints', () => {
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

  it('GET /api/v1/users should return list of users', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ],
    });

    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
  });

  it('POST /api/v1/users should create a user', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // duplicate check
      .mockResolvedValueOnce({ rows: [{ id: 3, name: 'Charlie', email: 'charlie@example.com' }] }); // create

    const res = await request(app)
      .post('/api/v1/users')
      .send({ name: 'Charlie', email: 'charlie@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Charlie');
  });

  it('POST /api/v1/users without name or email should return 400', async () => {
    const res = await request(app).post('/api/v1/users').send({ name: 'Charlie' });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
