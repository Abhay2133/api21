import request from 'supertest';
import { createApp } from '../../src/app.js';
import { databaseService, DatabaseService } from '../../src/core/database/database.service.js';
import { redisService } from '../../src/core/redis/redis.service.js';
import { bullMQService } from '../../src/core/bullmq/bullmq.service.js';
import { Express } from 'express';

describe('Admin Controller - Integration & Endpoint Tests', () => {
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

  describe('Admin Users Management Routes', () => {
    it('GET /api/v1/admin/users lists all admin users', async () => {
      // 1. Session auth lookup
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, token: 'admin_tok', username: 'admin', is_active: true }],
      });
      // 2. Users query
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, username: 'admin', role: 'superadmin', is_active: true, created_at: new Date() },
          { id: 2, username: 'devops', role: 'admin', is_active: true, created_at: new Date() },
        ],
      });

      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Cookie', 'admin_session=admin_tok');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[1].username).toBe('devops');
    });

    it('POST /api/v1/admin/users creates a new admin user', async () => {
      // 1. Session auth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, token: 'admin_tok', username: 'admin', is_active: true }],
      });
      // 2. Duplicate check
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // 3. Insert record
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 3,
            username: 'sec_admin',
            name: 'Security Admin',
            email: 'sec@api21.dev',
            role: 'admin',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Cookie', 'admin_session=admin_tok; csrf_token=csrf_123')
        .set('X-CSRF-Token', 'csrf_123')
        .send({
          username: 'sec_admin',
          password: 'Password123!',
          name: 'Security Admin',
          email: 'sec@api21.dev',
          role: 'admin',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.username).toBe('sec_admin');
    });

    it('PUT /api/v1/admin/users/:id updates an admin user profile', async () => {
      // 1. Session auth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, token: 'admin_tok', username: 'admin', is_active: true }],
      });
      // 2. Find user
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 3, username: 'sec_admin', role: 'admin' }],
      });
      // 3. Update query
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 3, username: 'sec_admin', name: 'Updated Sec Admin', role: 'superadmin' }],
      });

      const res = await request(app)
        .put('/api/v1/admin/users/3')
        .set('Cookie', 'admin_session=admin_tok; csrf_token=csrf_123')
        .set('X-CSRF-Token', 'csrf_123')
        .send({ name: 'Updated Sec Admin', role: 'superadmin' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Updated Sec Admin');
    });

    it('POST /api/v1/admin/users/:id/reset-password resets admin password', async () => {
      // 1. Session auth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, token: 'admin_tok', username: 'admin', is_active: true }],
      });
      // 2. Find user
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 3, username: 'sec_admin' }],
      });
      // 3. Update password
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .post('/api/v1/admin/users/3/reset-password')
        .set('Cookie', 'admin_session=admin_tok; csrf_token=csrf_123')
        .set('X-CSRF-Token', 'csrf_123')
        .send({ password: 'BrandNewSecretPass99!' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.success).toBe(true);
    });

    it('DELETE /api/v1/admin/users/:id deletes admin account', async () => {
      // 1. Session auth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, token: 'admin_tok', username: 'admin', is_active: true }],
      });
      // 2. Find user
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 3, username: 'sec_admin' }],
      });
      // 3. Delete query
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .delete('/api/v1/admin/users/3')
        .set('Cookie', 'admin_session=admin_tok; csrf_token=csrf_123')
        .set('X-CSRF-Token', 'csrf_123');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.success).toBe(true);
    });
  });

  describe('Admin Sessions Management Routes', () => {
    it('GET /api/v1/admin/sessions lists recorded sessions', async () => {
      // 1. Session auth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, token: 'admin_tok', username: 'admin', is_active: true }],
      });
      // 2. Sessions list
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, token: 'tok_1', username: 'admin', is_active: true },
          { id: 2, token: 'tok_2', username: 'devops', is_active: false },
        ],
      });

      const res = await request(app)
        .get('/api/v1/admin/sessions')
        .set('Cookie', 'admin_session=admin_tok');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(2);
    });

    it('POST /api/v1/admin/sessions/:id/deactivate revokes session', async () => {
      // 1. Session auth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, token: 'admin_tok', username: 'admin', is_active: true }],
      });
      // 2. Deactivate query
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .post('/api/v1/admin/sessions/tok_1/deactivate')
        .set('Cookie', 'admin_session=admin_tok; csrf_token=csrf_123')
        .set('X-CSRF-Token', 'csrf_123');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.success).toBe(true);
    });
  });
});
