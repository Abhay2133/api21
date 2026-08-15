import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/app.factory.js';
import { DatabaseService } from '../src/core/database/database.service.js';

describe('User Endpoints', () => {
  let app: INestApplication;
  let httpServer: any;
  const mockQuery = jest.fn();

  beforeAll(async () => {
    jest.spyOn(DatabaseService.prototype, 'onModuleInit').mockResolvedValue(undefined as any);
    jest.spyOn(DatabaseService.prototype, 'query').mockImplementation((...args: any[]) => mockQuery(...args));

    app = await createNestApp();
    await app.init();
    httpServer = app.getHttpServer();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /api/v1/users should return list of users', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ],
    });

    const res = await request(httpServer).get('/api/v1/users');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
  });

  it('POST /api/v1/users should create a user', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 3, name: 'Charlie', email: 'charlie@example.com' }],
    });

    const res = await request(httpServer)
      .post('/api/v1/users')
      .send({ name: 'Charlie', email: 'charlie@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Charlie');
  });

  it('POST /api/v1/users without name or email should return 400', async () => {
    const res = await request(httpServer).post('/api/v1/users').send({ name: 'Charlie' });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
