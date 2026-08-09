import request from 'supertest';
import { createApp } from '../src/app';

const mockQuery = jest.fn();

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
  getDbPool: () => ({
    query: mockQuery,
  }),
  checkDatabaseHealth: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/config/redis', () => ({
  getRedisClient: jest.fn().mockReturnValue(null),
  checkRedisHealth: jest.fn().mockResolvedValue(true),
}));



jest.mock('../src/queues/sampleQueue', () => {
  const mockJob = {
    id: 'job-12345',
    name: 'welcome_email',
    queueName: 'sampleQueue',
    data: { type: 'welcome_email', payload: { email: 'test@example.com' } },
    opts: { delay: 0, attempts: 3 },
    getState: jest.fn().mockResolvedValue('completed'),
    returnvalue: { success: true, processedAt: '2026-08-09T19:00:00.000Z', message: 'Success' },
    failedReason: null,
    timestamp: 1700000000000,
    finishedOn: 1700000001000,
    attemptsMade: 1,
  };

  return {
    addSampleJob: jest.fn().mockResolvedValue(mockJob),
    getSampleJob: jest.fn((id: string) => {
      if (id === 'job-12345') return Promise.resolve(mockJob);
      return Promise.resolve(undefined);
    }),
    getSampleQueueMetrics: jest.fn().mockResolvedValue({
      active: 0,
      completed: 5,
      failed: 1,
      delayed: 0,
      waiting: 2,
    }),
    sampleQueue: {
      client: Promise.resolve({ ping: () => Promise.resolve('PONG') }),
    },
  };
});

describe('Job Queues Endpoints', () => {
  const app = createApp();

  it('POST /api/v1/jobs should enqueue a valid job', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .send({
        type: 'welcome_email',
        payload: { email: 'user@example.com' },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.jobId).toBe('job-12345');
    expect(res.body.queue).toBe('sampleQueue');
  });

  it('POST /api/v1/jobs without job type should return 400', async () => {
    const res = await request(app).post('/api/v1/jobs').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('type');
  });

  it('GET /api/v1/jobs/:jobId should return job details and state', async () => {
    const res = await request(app).get('/api/v1/jobs/job-12345');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('job-12345');
    expect(res.body.state).toBe('completed');
    expect(res.body.returnvalue.success).toBe(true);
  });

  it('GET /api/v1/jobs/:jobId for non-existent job should return 404', async () => {
    const res = await request(app).get('/api/v1/jobs/non-existent-job');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  it('GET /api/v1/jobs/metrics should return queue counts', async () => {
    const res = await request(app).get('/api/v1/jobs/metrics');

    expect(res.status).toBe(200);
    expect(res.body.queue).toBe('sampleQueue');
    expect(res.body.metrics).toEqual({
      active: 0,
      completed: 5,
      failed: 1,
      delayed: 0,
      waiting: 2,
    });
  });
});
