import request from 'supertest';
import { createApp } from '../src/app';
import { config } from '../src/config/env';

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

jest.mock('../src/queues/sampleQueue', () => ({
  sampleQueue: {},
  initSampleWorker: jest.fn(),
}));

const mockQuery = jest.fn().mockResolvedValue({ rows: [] });

jest.mock('../src/config/database', () => ({
  getDbPool: jest.fn().mockReturnValue({
    query: (...args: any[]) => mockQuery(...args),
  }),
}));

jest.mock('../src/config/redis', () => ({
  getRedisClient: jest.fn().mockReturnValue(null),
}));

jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    unref: jest.fn(),
  }),
}));

describe('Deploy Webhook Endpoint', () => {
  const app = createApp();

  beforeEach(() => {
    mockQuery.mockClear();
  });

  it('POST /api/v1/webhooks/deploy with invalid token should return 401', async () => {
    const res = await request(app).post('/api/v1/webhooks/deploy?token=wrong-token');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Unauthorized');
  });

  it('POST /api/v1/webhooks/deploy with valid token should return 202 and trigger deploy process', async () => {
    const validToken = config.deployCiToken;
    const res = await request(app).post(`/api/v1/webhooks/deploy?token=${validToken}`);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('success');
    expect(res.body.deployment_id).toBeDefined();
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});
