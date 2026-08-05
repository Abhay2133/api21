import request from 'supertest';
import { createApp } from '../src/app';

const mockQuery = jest.fn();

jest.mock('../src/infrastructure/database', () => ({
  getDbPool: () => ({
    query: mockQuery,
  }),
  checkDatabaseHealth: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/infrastructure/redis', () => ({
  getRedisClient: jest.fn().mockReturnValue(null),
  checkRedisHealth: jest.fn().mockResolvedValue(true),
}));

describe('User Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    mockQuery.mockReset();
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
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 3, name: 'Charlie', email: 'charlie@example.com' }],
    });

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
