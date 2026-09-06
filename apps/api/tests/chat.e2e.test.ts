import request from 'supertest';
import http from 'http';
import WebSocket from 'ws';
import { createApp } from '../src/app.js';
import { databaseService, DatabaseService } from '../src/core/database/database.service.js';
import { redisService } from '../src/core/redis/redis.service.js';
import { bullMQService } from '../src/core/bullmq/bullmq.service.js';
import { setupChatWebSocket, closeChatWebSocket } from '../src/modules/chat/chat.ws.js';
import { up as migrationUp, down as migrationDown } from '../src/migrations/20260809000005_create_chat_tables.js';
import { Express } from 'express';

// In-Memory Database Simulator for true End-to-End Chat Flow
class InMemoryChatDb {
  users: any[] = [];
  conversations: any[] = [];
  messages: any[] = [];
  userIdSeq = 1;
  messageIdSeq = 1;

  constructor() {
    this.reset();
  }

  reset() {
    this.users = [];
    this.conversations = [
      {
        id: 1,
        slug: 'global',
        title: 'Global Chat',
        type: 'global',
        metadata: { description: 'Public global chat room' },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    this.messages = [];
    this.userIdSeq = 1;
    this.messageIdSeq = 1;
  }

  async query(text: string, params: any[] = []): Promise<{ rows: any[] }> {
    const normalized = text.replace(/\s+/g, ' ').trim();

    // 1. users: findUserByDeviceToken
    if (normalized.includes('FROM users') && normalized.includes('device_token = $1')) {
      const user = this.users.find((u) => u.device_token === params[0]);
      return { rows: user ? [{ ...user }] : [] };
    }

    // 2. users: findUserByDisplayName
    if (normalized.includes('FROM users') && normalized.includes('LOWER(display_name) = LOWER($1)')) {
      const user = this.users.find(
        (u) => u.display_name && u.display_name.toLowerCase() === String(params[0]).toLowerCase()
      );
      return { rows: user ? [{ ...user }] : [] };
    }

    // 3. users: findUserById
    if (normalized.includes('FROM users') && normalized.includes('WHERE id = $1')) {
      const user = this.users.find((u) => u.id === Number(params[0]));
      return { rows: user ? [{ ...user }] : [] };
    }

    // 4. users: createUser
    if (normalized.startsWith('INSERT INTO users')) {
      const user = {
        id: this.userIdSeq++,
        device_token: params[0],
        ip_address: params[1],
        display_name: params[2],
        is_claimed: params[3] ?? false,
        password_hash: params[4] || null,
        email: null,
        last_active_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.users.push(user);
      return { rows: [{ ...user }] };
    }

    // 5. users: updateUser & updateLastActive
    if (normalized.startsWith('UPDATE users SET') && normalized.includes('WHERE id =')) {
      const id = Number(params[params.length - 1]);
      const user = this.users.find((u) => u.id === id);
      if (user) {
        let pIdx = 0;
        if (normalized.includes('display_name = $')) user.display_name = params[pIdx++];
        if (normalized.includes('is_claimed = $')) user.is_claimed = params[pIdx++];
        if (normalized.includes('password_hash = $')) user.password_hash = params[pIdx++];
        if (normalized.includes('ip_address = $')) user.ip_address = params[pIdx++];
        if (normalized.includes('device_token = $')) user.device_token = params[pIdx++];
        user.updated_at = new Date().toISOString();
        user.last_active_at = new Date().toISOString();
        return { rows: [{ ...user }] };
      }
      return { rows: [] };
    }

    // 6. conversations: getGlobalConversation
    if (normalized.includes('FROM conversations') && normalized.includes("slug = 'global'")) {
      let conv = this.conversations.find((c) => c.slug === 'global');
      if (!conv) {
        conv = {
          id: 1,
          slug: 'global',
          title: 'Global Chat',
          type: 'global',
          metadata: { description: 'Public global chat room' },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.conversations.push(conv);
      }
      return { rows: [{ ...conv }] };
    }

    // 7. conversations: getConversationById
    if (normalized.includes('FROM conversations WHERE id = $1')) {
      const conv = this.conversations.find((c) => c.id === Number(params[0]));
      return { rows: conv ? [{ ...conv }] : [] };
    }

    // 8. messages: createMessage
    if (normalized.startsWith('INSERT INTO messages')) {
      const msg = {
        id: this.messageIdSeq++,
        conversation_id: Number(params[0]),
        user_id: params[1] ? Number(params[1]) : null,
        sender_name: params[2],
        sender_ip: params[3],
        content: params[4],
        message_type: params[5] || 'text',
        metadata: typeof params[6] === 'string' ? JSON.parse(params[6]) : params[6] || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.messages.push(msg);
      return { rows: [{ ...msg }] };
    }

    // 9. messages: getMessagesByConversation
    if (normalized.includes('FROM messages WHERE conversation_id = $1')) {
      const convId = Number(params[0]);
      let filtered = this.messages.filter((m) => m.conversation_id === convId);
      if (normalized.includes('AND id < $')) {
        const beforeId = Number(params[1]);
        filtered = filtered.filter((m) => m.id < beforeId);
      }
      const limit = Number(params[params.length - 1]);
      const sorted = [...filtered].sort((a, b) => b.id - a.id).slice(0, limit);
      return { rows: sorted };
    }

    return { rows: [] };
  }
}

describe('Global Chat System - Comprehensive End-to-End Suite', () => {
  let app: Express;
  const inMemoryDb = new InMemoryChatDb();

  beforeAll(async () => {
    jest.spyOn(DatabaseService.prototype, 'init').mockResolvedValue(undefined as any);
    jest
      .spyOn(DatabaseService.prototype, 'query')
      .mockImplementation((...args: any[]) => inMemoryDb.query(args[0], args[1]) as any);

    app = createApp();
  });

  beforeEach(() => {
    inMemoryDb.reset();
  });

  afterAll(async () => {
    await databaseService.close();
    await redisService.close();
    await bullMQService.closeAllQueuesAndWorkers(500);
  });

  // =========================================================================
  // 1. Database Migrations Verification
  // =========================================================================
  describe('Database Migrations (20260809000005_create_chat_tables)', () => {
    it('should verify knex migration up() creates tables, columns, indexes, and seeds global room', async () => {
      const mockTableBuilder: any = {
        uuid: jest.fn().mockReturnThis(),
        string: jest.fn().mockReturnThis(),
        boolean: jest.fn().mockReturnThis(),
        timestamp: jest.fn().mockReturnThis(),
        increments: jest.fn().mockReturnThis(),
        bigIncrements: jest.fn().mockReturnThis(),
        integer: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        jsonb: jest.fn().mockReturnThis(),
        nullable: jest.fn().mockReturnThis(),
        notNullable: jest.fn().mockReturnThis(),
        unique: jest.fn().mockReturnThis(),
        defaultTo: jest.fn().mockReturnThis(),
        index: jest.fn().mockReturnThis(),
        primary: jest.fn().mockReturnThis(),
        references: jest.fn().mockReturnThis(),
        inTable: jest.fn().mockReturnThis(),
        onDelete: jest.fn().mockReturnThis(),
      };

      const mockQueryBuilder: any = {
        insert: jest.fn().mockReturnThis(),
        onConflict: jest.fn().mockReturnThis(),
        ignore: jest.fn().mockResolvedValue(undefined),
      };

      const mockKnex: any = jest.fn().mockReturnValue(mockQueryBuilder);
      mockKnex.schema = {
        hasTable: jest.fn((tableName: string) => {
          if (tableName === 'users') return Promise.resolve(true);
          if (tableName === 'conversations') return Promise.resolve(false);
          if (tableName === 'messages') return Promise.resolve(false);
          return Promise.resolve(false);
        }),
        hasColumn: jest.fn().mockResolvedValue(false),
        alterTable: jest.fn((_table: string, cb: (table: any) => void) => {
          cb(mockTableBuilder);
          return Promise.resolve();
        }),
        createTable: jest.fn((_table: string, cb: (table: any) => void) => {
          cb(mockTableBuilder);
          return Promise.resolve();
        }),
      };
      mockKnex.raw = jest.fn().mockResolvedValue(undefined);
      mockKnex.fn = { now: jest.fn().mockReturnValue('NOW()') };

      await migrationUp(mockKnex);

      expect(mockKnex.schema.hasTable).toHaveBeenCalledWith('users');
      expect(mockKnex.schema.hasTable).toHaveBeenCalledWith('conversations');
      expect(mockKnex.schema.hasTable).toHaveBeenCalledWith('messages');
      expect(mockKnex.schema.alterTable).toHaveBeenCalledWith('users', expect.any(Function));
      expect(mockKnex.schema.createTable).toHaveBeenCalledWith('conversations', expect.any(Function));
      expect(mockKnex.schema.createTable).toHaveBeenCalledWith('messages', expect.any(Function));
      expect(mockKnex.raw).toHaveBeenCalledWith('ALTER TABLE users ALTER COLUMN email DROP NOT NULL;');
      expect(mockKnex.raw).toHaveBeenCalledWith('ALTER TABLE users ALTER COLUMN name DROP NOT NULL;');
      expect(mockKnex).toHaveBeenCalledWith('conversations');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'global', title: 'Global Chat', type: 'global' })
      );
    });

    it('should verify knex migration down() drops tables and columns cleanly', async () => {
      const mockTableBuilder: any = {
        dropIndex: jest.fn().mockReturnThis(),
        dropColumn: jest.fn().mockReturnThis(),
      };

      const mockKnex: any = {
        schema: {
          dropTableIfExists: jest.fn().mockResolvedValue(undefined),
          hasTable: jest.fn().mockResolvedValue(true),
          hasColumn: jest.fn().mockResolvedValue(true),
          alterTable: jest.fn((_table: string, cb: (table: any) => void) => {
            cb(mockTableBuilder);
            return Promise.resolve();
          }),
        },
      };

      await migrationDown(mockKnex);

      expect(mockKnex.schema.dropTableIfExists).toHaveBeenCalledWith('messages');
      expect(mockKnex.schema.dropTableIfExists).toHaveBeenCalledWith('conversations');
      expect(mockKnex.schema.alterTable).toHaveBeenCalledWith('users', expect.any(Function));
      expect(mockTableBuilder.dropColumn).toHaveBeenCalledWith('device_token');
      expect(mockTableBuilder.dropColumn).toHaveBeenCalledWith('password_hash');
    });
  });

  // =========================================================================
  // 2. Multi-User Simulation on the Same IP (127.0.0.1)
  // =========================================================================
  describe('Multi-User Simulation on Same IP (127.0.0.1)', () => {
    it('should allow two distinct users on 127.0.0.1 to handshake and chat concurrently without session crosstalk', async () => {
      const clientIp = '127.0.0.1';

      // User 1 Handshake
      const res1 = await request(app)
        .post('/api/v1/chat/identity/handshake')
        .set('x-forwarded-for', clientIp)
        .send({});

      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe('success');
      const user1Token = res1.body.data.token;
      const user1Data = res1.body.data.user;
      expect(user1Token).toBeDefined();
      expect(user1Data.display_name).toMatch(/^Guest-/);
      expect(user1Data.is_claimed).toBe(false);

      // User 2 Handshake on the same IP
      const res2 = await request(app)
        .post('/api/v1/chat/identity/handshake')
        .set('x-forwarded-for', clientIp)
        .send({});

      expect(res2.status).toBe(200);
      expect(res2.body.status).toBe('success');
      const user2Token = res2.body.data.token;
      const user2Data = res2.body.data.user;

      // Both users must have distinct tokens and unique IDs despite having the same IP
      expect(user2Token).not.toBe(user1Token);
      expect(user2Data.id).not.toBe(user1Data.id);

      // User 1 sends message using Authorization: Bearer header
      const msgRes1 = await request(app)
        .post('/api/v1/chat/conversations/1/messages')
        .set('x-forwarded-for', clientIp)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Message from User 1 on 127.0.0.1' });

      expect(msgRes1.status).toBe(201);
      expect(msgRes1.body.data.sender_name).toBe(user1Data.display_name);
      expect(msgRes1.body.data.user_id).toBe(user1Data.id);

      // User 2 sends message using X-Device-Token header (alternative auth)
      const msgRes2 = await request(app)
        .post('/api/v1/chat/conversations/1/messages')
        .set('x-forwarded-for', clientIp)
        .set('x-device-token', user2Token)
        .send({ content: 'Message from User 2 on 127.0.0.1' });

      expect(msgRes2.status).toBe(201);
      expect(msgRes2.body.data.sender_name).toBe(user2Data.display_name);
      expect(msgRes2.body.data.user_id).toBe(user2Data.id);

      // Verify conversation message list contains both messages attributed accurately
      const listRes = await request(app)
        .get('/api/v1/chat/conversations/1/messages')
        .set('x-forwarded-for', clientIp);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.messages).toHaveLength(2);
      expect(listRes.body.data.messages[0].sender_name).toBe(user1Data.display_name);
      expect(listRes.body.data.messages[1].sender_name).toBe(user2Data.display_name);

      // Re-handshake preserves original user sessions respectively
      const reconnect1 = await request(app)
        .post('/api/v1/chat/identity/handshake')
        .set('x-forwarded-for', clientIp)
        .send({ token: user1Token });
      expect(reconnect1.body.data.user.id).toBe(user1Data.id);

      const reconnect2 = await request(app)
        .post('/api/v1/chat/identity/handshake')
        .set('x-forwarded-for', clientIp)
        .send({ token: user2Token });
      expect(reconnect2.body.data.user.id).toBe(user2Data.id);
    });
  });

  // =========================================================================
  // 3. Password Protection & Handle Claiming Lifecycle
  // =========================================================================
  describe('Password Protection & Handle Claiming', () => {
    it('should allow User A to claim handle "SuperCoder", reject User B with wrong password (401), and link User B with correct password', async () => {
      // 1. User A Handshake
      const handshakeA = await request(app)
        .post('/api/v1/chat/identity/handshake')
        .send({});
      const tokenA = handshakeA.body.data.token;

      // 2. User B Handshake
      const handshakeB = await request(app)
        .post('/api/v1/chat/identity/handshake')
        .send({});
      const tokenB = handshakeB.body.data.token;

      // 3. User A claims "SuperCoder" with password "SuperSecret123"
      const claimA = await request(app)
        .post('/api/v1/chat/identity/claim')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ displayName: 'SuperCoder', password: 'SuperSecret123' });

      expect(claimA.status).toBe(200);
      expect(claimA.body.status).toBe('success');
      expect(claimA.body.data.user.display_name).toBe('SuperCoder');
      expect(claimA.body.data.user.is_claimed).toBe(true);

      // 4. User B tries to claim "SuperCoder" with incorrect password -> 401
      const claimBWrong = await request(app)
        .post('/api/v1/chat/identity/claim')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ displayName: 'SuperCoder', password: 'wrongPassword123' });

      expect(claimBWrong.status).toBe(401);
      expect(claimBWrong.body.status).toBe('error');
      expect(claimBWrong.body.message).toContain('password-protected');

      // 5. Case-insensitivity check: User B tries to claim "supercoder" with wrong password -> 401
      const claimBCaseWrong = await request(app)
        .post('/api/v1/chat/identity/claim')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ displayName: 'supercoder', password: 'wrongPassword123' });

      expect(claimBCaseWrong.status).toBe(401);

      // 6. User B enters correct password "SuperSecret123" -> unlocks/links profile
      const claimBCorrect = await request(app)
        .post('/api/v1/chat/identity/claim')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ displayName: 'SuperCoder', password: 'SuperSecret123' });

      expect(claimBCorrect.status).toBe(200);
      expect(claimBCorrect.body.status).toBe('success');
      expect(claimBCorrect.body.data.user.display_name).toBe('SuperCoder');
      expect(claimBCorrect.body.data.user.is_claimed).toBe(true);

      // 7. User B now sends message as "SuperCoder"
      const msgRes = await request(app)
        .post('/api/v1/chat/conversations/1/messages')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ content: 'I have linked my SuperCoder account on this device' });

      expect(msgRes.status).toBe(201);
      expect(msgRes.body.data.sender_name).toBe('SuperCoder');
    });
  });

  // =========================================================================
  // 4. Pagination & Message Limits
  // =========================================================================
  describe('Pagination & Message Limits', () => {
    it('should paginate messages accurately using limit and beforeId cursors', async () => {
      // Handshake to get token
      const handshake = await request(app).post('/api/v1/chat/identity/handshake').send({});
      const token = handshake.body.data.token;

      // Seed 15 messages sequentially
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .post('/api/v1/chat/conversations/1/messages')
          .set('Authorization', `Bearer ${token}`)
          .send({ content: `Paginated message #${i}` });
      }

      // Page 1: Limit 5 (latest messages: #11 to #15)
      const page1 = await request(app).get('/api/v1/chat/conversations/1/messages?limit=5');
      expect(page1.status).toBe(200);
      expect(page1.body.data.messages).toHaveLength(5);
      expect(page1.body.data.hasMore).toBe(true);
      expect(page1.body.data.messages[0].content).toBe('Paginated message #11');
      expect(page1.body.data.messages[4].content).toBe('Paginated message #15');

      const oldestIdOnPage1 = page1.body.data.messages[0].id;

      // Page 2: Limit 5 before oldestId of page 1 (messages: #6 to #10)
      const page2 = await request(app).get(
        `/api/v1/chat/conversations/1/messages?limit=5&beforeId=${oldestIdOnPage1}`
      );
      expect(page2.status).toBe(200);
      expect(page2.body.data.messages).toHaveLength(5);
      expect(page2.body.data.hasMore).toBe(true);
      expect(page2.body.data.messages[0].content).toBe('Paginated message #6');
      expect(page2.body.data.messages[4].content).toBe('Paginated message #10');

      const oldestIdOnPage2 = page2.body.data.messages[0].id;

      // Page 3: Limit 5 before oldestId of page 2 (messages: #1 to #5)
      const page3 = await request(app).get(
        `/api/v1/chat/conversations/1/messages?limit=5&beforeId=${oldestIdOnPage2}`
      );
      expect(page3.status).toBe(200);
      expect(page3.body.data.messages).toHaveLength(5);
      expect(page3.body.data.hasMore).toBe(false);
      expect(page3.body.data.messages[0].content).toBe('Paginated message #1');
      expect(page3.body.data.messages[4].content).toBe('Paginated message #5');
    });

    it('should reject invalid conversation ID with 400 Bad Request', async () => {
      const res = await request(app).get('/api/v1/chat/conversations/not-a-number/messages');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid conversation ID');
    });
  });

  // =========================================================================
  // 5. Input Validation & Edge Cases
  // =========================================================================
  describe('Input Validation & Edge Cases', () => {
    let validToken: string;

    beforeEach(async () => {
      const res = await request(app).post('/api/v1/chat/identity/handshake').send({});
      validToken = res.body.data.token;
    });

    it('should reject empty or whitespace-only messages with 400 Bad Request', async () => {
      const emptyRes = await request(app)
        .post('/api/v1/chat/conversations/1/messages')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: '' });

      expect(emptyRes.status).toBe(400);

      const whitespaceRes = await request(app)
        .post('/api/v1/chat/conversations/1/messages')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: '     ' });

      expect(whitespaceRes.status).toBe(400);
    });

    it('should reject oversized messages (>2000 characters) with 400 Bad Request', async () => {
      const hugeMessage = 'A'.repeat(2001);
      const res = await request(app)
        .post('/api/v1/chat/conversations/1/messages')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: hugeMessage });

      expect(res.status).toBe(400);
    });

    it('should reject display names shorter than 2 characters with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/chat/identity/claim')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ displayName: 'X', password: 'validPassword123' });

      expect(res.status).toBe(400);
    });

    it('should reject display names longer than 30 characters with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/chat/identity/claim')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ displayName: 'A'.repeat(35), password: 'validPassword123' });

      expect(res.status).toBe(400);
    });

    it('should reject display names containing illegal special characters with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/chat/identity/claim')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ displayName: 'Hacker<script>', password: 'validPassword123' });

      expect(res.status).toBe(400);
    });

    it('should reject passwords shorter than 4 characters with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/chat/identity/claim')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ displayName: 'ValidName', password: '123' });

      expect(res.status).toBe(400);
    });

    it('should reject chat message without authentication with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/chat/conversations/1/messages')
        .send({ content: 'Unauthorized message' });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Authentication token required');
    });

    it('should reject chat message with invalid or expired session token with 401', async () => {
      const res = await request(app)
        .post('/api/v1/chat/conversations/1/messages')
        .set('Authorization', 'Bearer 00000000-0000-0000-0000-000000000000')
        .send({ content: 'Invalid token message' });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid or expired session token');
    });
  });

  // =========================================================================
  // 6. Global Conversation Route & Stats
  // =========================================================================
  describe('GET /api/v1/chat/conversations/global', () => {
    it('should return global room metadata and current online user count', async () => {
      const res = await request(app).get('/api/v1/chat/conversations/global');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.conversation.slug).toBe('global');
      expect(typeof res.body.data.onlineCount).toBe('number');
    });
  });

  // =========================================================================
  // 7. Rate Limiting Verification
  // =========================================================================
  describe('Rate Limiting on Chat Endpoints', () => {
    it('should enforce rate limits and respond with 429 when threshold is exceeded', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockRedis = {
        status: 'ready',
        multi: jest.fn().mockReturnValue({
          zremrangebyscore: jest.fn().mockReturnThis(),
          zadd: jest.fn().mockReturnThis(),
          zcard: jest.fn().mockReturnThis(),
          expire: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([null, null, [null, 1005], null]),
        }),
      };

      const redisSpy = jest.spyOn(redisService, 'getClient').mockReturnValue(mockRedis as any);

      const res = await request(app)
        .post('/api/v1/chat/identity/handshake')
        .set('x-forwarded-for', '198.51.100.42')
        .send({});

      expect(res.status).toBe(429);
      expect(res.body.status).toBe('error');
      expect(res.body.error).toBe('Too Many Requests');
      expect(res.headers['x-ratelimit-remaining']).toBe('0');

      redisSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  // =========================================================================
  // 8. WebSocket Multi-User Real-time Chat Simulation
  // =========================================================================
  describe('WebSocket Real-time Chat Simulation', () => {
    let server: http.Server;
    let wss: any;
    let wsPort: number;
    let client1: WebSocket;
    let client2: WebSocket;

    beforeAll(async () => {
      server = http.createServer(app);
      wss = setupChatWebSocket(server);
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const address = server.address() as any;
      wsPort = address.port;
    });

    afterAll(async () => {
      if (client1 && client1.readyState === WebSocket.OPEN) client1.close();
      if (client2 && client2.readyState === WebSocket.OPEN) client2.close();
      closeChatWebSocket();
      await new Promise<void>((resolve) => {
        wss.close(() => {
          server.close(() => resolve());
          (server as any).closeAllConnections?.();
        });
      });
    });

    it('should connect multiple clients via WebSocket, exchange ping/pong, and broadcast messages', async () => {
      // 1. Generate two user tokens via HTTP handshake
      const u1Handshake = await request(app).post('/api/v1/chat/identity/handshake').send({});
      const token1 = u1Handshake.body.data.token;

      const u2Handshake = await request(app).post('/api/v1/chat/identity/handshake').send({});
      const token2 = u2Handshake.body.data.token;

      // 2. Connect Client 1 via WebSocket
      client1 = new WebSocket(`ws://127.0.0.1:${wsPort}/ws/chat?token=${token1}`);
      const client1Messages: any[] = [];
      client1.on('message', (data) => {
        client1Messages.push(JSON.parse(data.toString()));
      });

      // Wait for Client 1 INIT
      await new Promise<void>((resolve) => {
        client1.on('open', () => resolve());
      });
      await new Promise((r) => setTimeout(r, 100));

      expect(client1Messages.some((m) => m.type === 'INIT')).toBe(true);

      // 3. Connect Client 2 via WebSocket
      client2 = new WebSocket(`ws://127.0.0.1:${wsPort}/ws/chat?token=${token2}`);
      const client2Messages: any[] = [];
      client2.on('message', (data) => {
        client2Messages.push(JSON.parse(data.toString()));
      });

      await new Promise<void>((resolve) => {
        client2.on('open', () => resolve());
      });
      await new Promise((r) => setTimeout(r, 100));

      expect(client2Messages.some((m) => m.type === 'INIT')).toBe(true);

      // 4. Test PING -> PONG
      client1.send(JSON.stringify({ type: 'PING' }));
      await new Promise((r) => setTimeout(r, 50));
      expect(client1Messages.some((m) => m.type === 'PONG')).toBe(true);

      // 5. Client 1 sends real-time message -> Client 2 receives broadcast
      client1.send(
        JSON.stringify({
          type: 'SEND_MESSAGE',
          payload: { content: 'Realtime hello from Client 1', conversationId: 1 },
        })
      );
      await new Promise((r) => setTimeout(r, 200));

      const receivedByClient2 = client2Messages.find(
        (m) => m.type === 'NEW_MESSAGE' && m.payload?.content === 'Realtime hello from Client 1'
      );
      expect(receivedByClient2).toBeDefined();

      // 6. Clean up WebSocket connections and verify presence update
      client2.close();
      await new Promise((r) => setTimeout(r, 100));

      const presenceUpdate = client1Messages.find((m) => m.type === 'PRESENCE_UPDATE');
      expect(presenceUpdate).toBeDefined();

      client1.close();
      await new Promise((r) => setTimeout(r, 50));
    });
  });
});
