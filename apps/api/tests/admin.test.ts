import request from 'supertest';
import { createApp } from '../src/app.js';
import { config } from '../src/config/env.js';
import { databaseService, DatabaseService } from '../src/core/database/database.service.js';
import { redisService } from '../src/core/redis/redis.service.js';
import { bullMQService } from '../src/core/bullmq/bullmq.service.js';
import { Express } from 'express';

describe('Admin Authentication & Management Endpoints (TDD)', () => {
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

  describe('POST /api/v1/admin/login', () => {
    it('should authenticate valid master credentials and return tokens', async () => {
      // Mock session insert
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            token: 'mock-session-token-12345',
            username: 'admin',
            is_active: true,
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/admin/login')
        .send({ username: 'admin', password: 'securepassword' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.csrfToken).toBeDefined();
      expect(res.body.data.user.username).toBe('admin');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/admin/login')
        .send({ username: 'admin', password: 'wrong-password' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should return 400 when username or password is missing', async () => {
      const res = await request(app)
        .post('/api/v1/admin/login')
        .send({ username: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/admin/me', () => {
    it('should return admin profile when valid session token is provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            token: 'valid-admin-token',
            username: 'admin',
            is_active: true,
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/admin/me')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.username).toBe('admin');
    });

    it('should return 401 when token is missing', async () => {
      const res = await request(app).get('/api/v1/admin/me');
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/admin/system-metrics', () => {
    it('should return live CPU, RAM, Disk, and PM2 process statistics', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10, token: 'valid-token', username: 'admin', is_active: true }],
      });

      const res = await request(app)
        .get('/api/v1/admin/system-metrics')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.cpu).toBeDefined();
      expect(res.body.data.cpu.cores).toBeGreaterThan(0);
      expect(res.body.data.memory).toBeDefined();
      expect(res.body.data.memory.totalMB).toBeGreaterThan(0);
      expect(res.body.data.uptime).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/deployments', () => {
    it('should return list of deployments from database', async () => {
      // 1. Mock session auth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10, token: 'valid-token', username: 'admin', is_active: true }],
      });
      // 2. Mock deployments select
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'dep_1',
            status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'dep_2',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/admin/deployments')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].id).toBe('dep_1');
    });
  });

  describe('GET /api/v1/admin/deployments/:id/logs', () => {
    it('should return logs for specific deployment ID', async () => {
      // 1. Mock session auth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10, token: 'valid-token', username: 'admin', is_active: true }],
      });
      // 2. Mock deployment logs select
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, deployment_id: 'dep_1', message: 'Step 1: Cloning', created_at: new Date().toISOString() },
          { id: 2, deployment_id: 'dep_1', message: 'Step 2: Building', created_at: new Date().toISOString() },
        ],
      });

      const res = await request(app)
        .get('/api/v1/admin/deployments/dep_1/logs')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].message).toContain('Cloning');
    });
  });

  describe('POST /api/v1/admin/terminal/ticket', () => {
    it('should generate a short-lived single-use ticket for WebSocket terminal connection', async () => {
      // Mock session auth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10, token: 'valid-token', username: 'admin', is_active: true }],
      });

      const res = await request(app)
        .post('/api/v1/admin/terminal/ticket')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.ticket).toBeDefined();
      expect(res.body.data.expiresIn).toBeDefined();
    });
  });
});
