import request from 'supertest';
import { createApp } from '../src/app';

// Mock DB and Redis infrastructure for fast unit test
jest.mock('../src/infrastructure/database', () => ({
  checkDatabaseHealth: jest.fn().mockResolvedValue(true),
  getDbPool: jest.fn(),
}));

jest.mock('../src/infrastructure/redis', () => ({
  checkRedisHealth: jest.fn().mockResolvedValue(true),
  getRedisClient: jest.fn().mockReturnValue(null),
}));

describe('Health Endpoint', () => {
  const app = createApp();

  it('GET /api/v1/health should return status 200 and healthy details', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.services).toEqual({
      database: 'connected',
      redis: 'connected',
    });
  });
});
