import request from 'supertest';
import { createApp } from '../src/app.js';
import { databaseService, DatabaseService } from '../src/core/database/database.service.js';
import { redisService } from '../src/core/redis/redis.service.js';
import { bullMQService } from '../src/core/bullmq/bullmq.service.js';
import { Express } from 'express';

describe('Admin Authentication & Management Endpoints (Cookie + CSRF TDD)', () => {
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
    it('should authenticate master credentials and set persistent cookies', async () => {
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
      expect(res.body.data.csrfToken).toBeDefined();
      expect(res.body.data.user.username).toBe('admin');
      
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('admin_session='))).toBe(true);
      expect(cookies.some((c) => c.includes('csrf_token='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
      expect(cookies.some((c) => c.includes('Max-Age=604800'))).toBe(true);
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
    it('should return admin profile when valid admin_session cookie is sent', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            token: 'valid-cookie-token',
            username: 'admin',
            is_active: true,
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/admin/me')
        .set('Cookie', 'admin_session=valid-cookie-token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.username).toBe('admin');
    });

    it('should return 401 when cookie is missing', async () => {
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
        .set('Cookie', 'admin_session=valid-token');

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
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10, token: 'valid-token', username: 'admin', is_active: true }],
      });
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
        .set('Cookie', 'admin_session=valid-token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].id).toBe('dep_1');
    });
  });

  describe('GET /api/v1/admin/deployments/:id/logs', () => {
    it('should return logs for specific deployment ID', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10, token: 'valid-token', username: 'admin', is_active: true }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, deployment_id: 'dep_1', message: 'Step 1: Cloning', created_at: new Date().toISOString() },
          { id: 2, deployment_id: 'dep_1', message: 'Step 2: Building', created_at: new Date().toISOString() },
        ],
      });

      const res = await request(app)
        .get('/api/v1/admin/deployments/dep_1/logs')
        .set('Cookie', 'admin_session=valid-token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].message).toContain('Cloning');
    });
  });

  describe('POST /api/v1/admin/terminal/ticket (Double Submit CSRF Verification)', () => {
    it('should generate ticket when valid cookie and matching X-CSRF-Token are provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10, token: 'valid-token', username: 'admin', is_active: true }],
      });

      const res = await request(app)
        .post('/api/v1/admin/terminal/ticket')
        .set('Cookie', 'admin_session=valid-token; csrf_token=csrf_secret_999')
        .set('X-CSRF-Token', 'csrf_secret_999');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.ticket).toBeDefined();
    });

    it('should reject mutating request with 403 when CSRF token is missing or mismatched', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10, token: 'valid-token', username: 'admin', is_active: true }],
      });

      const res = await request(app)
        .post('/api/v1/admin/terminal/ticket')
        .set('Cookie', 'admin_session=valid-token; csrf_token=csrf_secret_999')
        .set('X-CSRF-Token', 'wrong_csrf_token');

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('CSRF token verification failed');
    });
  });

  describe('POST /api/v1/admin/logout', () => {
    it('should clear cookies and revoke active session', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10, token: 'valid-token', username: 'admin', is_active: true }],
      });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .post('/api/v1/admin/logout')
        .set('Cookie', 'admin_session=valid-token; csrf_token=csrf_secret_999')
        .set('X-CSRF-Token', 'csrf_secret_999');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.includes('admin_session=;') || c.includes('Max-Age=0'))).toBe(true);
    });
  });
});
