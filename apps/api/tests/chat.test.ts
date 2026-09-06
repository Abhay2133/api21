import request from 'supertest';
import { createApp } from '../src/app.js';
import { databaseService, DatabaseService } from '../src/core/database/database.service.js';
import { redisService } from '../src/core/redis/redis.service.js';
import { bullMQService } from '../src/core/bullmq/bullmq.service.js';
import { Express } from 'express';
import bcrypt from 'bcryptjs';

describe('Chat Endpoints', () => {
  let app: Express;
  const mockQuery = jest.fn();

  beforeAll(async () => {
    jest.spyOn(DatabaseService.prototype, 'init').mockResolvedValue(undefined as any);
    jest
      .spyOn(DatabaseService.prototype, 'query')
      .mockImplementation((...args: any[]) => mockQuery(...args));

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

  describe('POST /api/v1/chat/identity/handshake', () => {
    it('should generate a new guest session when no token is provided', async () => {
      const mockGuestUser = {
        id: 1,
        device_token: '11111111-2222-3333-4444-555555555555',
        ip_address: '127.0.0.1',
        display_name: 'Guest-A1B2',
        is_claimed: false,
        created_at: new Date().toISOString(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockGuestUser] });

      const res = await request(app).post('/api/v1/chat/identity/handshake').send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.token).toBe('11111111-2222-3333-4444-555555555555');
      expect(res.body.data.user.display_name).toBe('Guest-A1B2');
    });

    it('should return existing session when valid token is supplied', async () => {
      const mockExistingUser = {
        id: 2,
        device_token: 'valid-token-uuid',
        ip_address: '127.0.0.1',
        display_name: 'Abhay',
        is_claimed: true,
      };

      // 1. findUserByDeviceToken
      mockQuery.mockResolvedValueOnce({ rows: [mockExistingUser] });
      // 2. updateUser IP and activity
      mockQuery.mockResolvedValueOnce({ rows: [mockExistingUser] });

      const res = await request(app)
        .post('/api/v1/chat/identity/handshake')
        .send({ token: 'valid-token-uuid' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.display_name).toBe('Abhay');
      expect(res.body.data.user.is_claimed).toBe(true);
    });
  });

  describe('POST /api/v1/chat/identity/claim', () => {
    it('should reject claim request without auth header', async () => {
      const res = await request(app)
        .post('/api/v1/chat/identity/claim')
        .send({ displayName: 'NewName', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should claim handle with password successfully', async () => {
      const mockCurrentUser = {
        id: 3,
        device_token: 'token-abc',
        ip_address: '127.0.0.1',
        display_name: 'Guest-1234',
        is_claimed: false,
      };

      const mockUpdatedUser = {
        ...mockCurrentUser,
        display_name: 'AbhayBisht',
        is_claimed: true,
      };

      // 1. Auth middleware: findUserByDeviceToken
      mockQuery.mockResolvedValueOnce({ rows: [mockCurrentUser] });
      // 2. findUserByDisplayName check
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // 3. updateUser with password_hash
      mockQuery.mockResolvedValueOnce({ rows: [mockUpdatedUser] });

      const res = await request(app)
        .post('/api/v1/chat/identity/claim')
        .set('Authorization', 'Bearer token-abc')
        .send({ displayName: 'AbhayBisht', password: 'securePass123' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.display_name).toBe('AbhayBisht');
      expect(res.body.data.user.is_claimed).toBe(true);
    });

    it('should reject claim if handle is already claimed with incorrect password', async () => {
      const mockCurrentUser = {
        id: 4,
        device_token: 'token-xyz',
        ip_address: '127.0.0.1',
        display_name: 'Guest-9999',
        is_claimed: false,
      };

      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      const mockClaimedUser = {
        id: 5,
        device_token: 'other-token',
        display_name: 'ClaimedHero',
        is_claimed: true,
        password_hash: hashedPassword,
      };

      // 1. Auth middleware
      mockQuery.mockResolvedValueOnce({ rows: [mockCurrentUser] });
      // 2. findUserByDisplayName returns claimed user
      mockQuery.mockResolvedValueOnce({ rows: [mockClaimedUser] });

      const res = await request(app)
        .post('/api/v1/chat/identity/claim')
        .set('Authorization', 'Bearer token-xyz')
        .send({ displayName: 'ClaimedHero', password: 'wrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/chat/conversations/global', () => {
    it('should return global conversation and online count', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            slug: 'global',
            title: 'Global Chat',
            type: 'global',
            is_active: true,
          },
        ],
      });

      const res = await request(app).get('/api/v1/chat/conversations/global');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.conversation.slug).toBe('global');
      expect(typeof res.body.data.onlineCount).toBe('number');
    });
  });

  describe('GET /api/v1/chat/conversations/:id/messages', () => {
    it('should return list of messages', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            conversation_id: 1,
            sender_name: 'Abhay',
            content: 'Hello world',
            created_at: new Date().toISOString(),
          },
        ],
      });

      const res = await request(app).get('/api/v1/chat/conversations/1/messages');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.messages).toHaveLength(1);
    });
  });

  describe('POST /api/v1/chat/conversations/:id/messages', () => {
    it('should send message successfully when authenticated', async () => {
      const mockUser = {
        id: 1,
        device_token: 'auth-token',
        display_name: 'Abhay',
        is_claimed: true,
      };

      const mockCreatedMessage = {
        id: 10,
        conversation_id: 1,
        user_id: 1,
        sender_name: 'Abhay',
        sender_ip: '127.0.0.1',
        content: 'Testing chat message sending',
        message_type: 'text',
        created_at: new Date().toISOString(),
      };

      // 1. Auth middleware
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
      // 2. createMessage
      mockQuery.mockResolvedValueOnce({ rows: [mockCreatedMessage] });

      const res = await request(app)
        .post('/api/v1/chat/conversations/1/messages')
        .set('Authorization', 'Bearer auth-token')
        .send({ content: 'Testing chat message sending' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.content).toBe('Testing chat message sending');
    });
  });
});
