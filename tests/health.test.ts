import request from 'supertest';
import { createApp } from '../src/app';

jest.mock('@bull-board/api', () => ({
  createBullBoard: jest.fn(),
}));

jest.mock('@bull-board/api/bullMQAdapter', () => ({
  BullMQAdapter: jest.fn(),
}));

jest.mock('@bull-board/express', () => ({
  ExpressAdapter: jest.fn().mockImplementation(() => ({
    setBasePath: jest.fn(),
    getRouter: jest.fn().mockReturnValue((req: any, res: any, next: any) => next()),
  })),
}));

jest.mock('../src/config/database', () => ({
  checkDatabaseHealth: jest.fn().mockResolvedValue(true),
  getDbPool: jest.fn(),
}));

jest.mock('../src/config/redis', () => ({
  checkRedisHealth: jest.fn().mockResolvedValue(true),
  getRedisClient: jest.fn().mockReturnValue(null),
}));

jest.mock('../src/config/bullmq', () => ({
  getBullMQConnectionOptions: jest.fn().mockReturnValue({ host: '127.0.0.1', port: 6379 }),
  registerQueue: jest.fn((q) => q),
  registerWorker: jest.fn((w) => w),
  checkQueueHealth: jest.fn().mockResolvedValue(true),
  closeAllQueuesAndWorkers: jest.fn().mockResolvedValue(undefined),
}));


jest.mock('../src/queues/sampleQueue', () => ({
  sampleQueue: {},
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
      bullmq: 'connected',
    });
  });
});
