import request from 'supertest';
import { createApp } from '../src/app.js';
import { databaseService, DatabaseService } from '../src/core/database/database.service.js';
import { redisService } from '../src/core/redis/redis.service.js';
import { bullMQService } from '../src/core/bullmq/bullmq.service.js';
import { jobsService } from '../src/modules/jobs/jobs.service.js';
import { AppError } from '../src/common/middleware/error.middleware.js';
import { Express } from 'express';

describe('Job Queues Endpoints', () => {
  let app: Express;

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

  beforeAll(async () => {
    jest.spyOn(DatabaseService.prototype, 'init').mockResolvedValue(undefined as any);

    jest.spyOn(jobsService, 'enqueueJob').mockImplementation(async (dto: any) => {
      return {
        success: true,
        message: 'Job enqueued successfully',
        jobId: 'job-12345',
        queue: 'sampleQueue',
        type: dto.type,
        opts: {
          delay: dto.delay || 0,
          attempts: 3,
        },
      };
    });

    jest.spyOn(jobsService, 'getJobStatus').mockImplementation(async (jobId: string) => {
      if (jobId === 'job-12345') {
        return {
          id: mockJob.id,
          name: mockJob.name,
          queue: mockJob.queueName,
          state: 'completed',
          data: mockJob.data,
          returnvalue: mockJob.returnvalue,
          failedReason: mockJob.failedReason,
          timestamp: mockJob.timestamp,
          finishedOn: mockJob.finishedOn,
          attemptsMade: mockJob.attemptsMade,
        };
      }
      throw new AppError(`Job with ID "${jobId}" not found`, 404);
    });

    jest.spyOn(jobsService, 'getQueueMetrics').mockResolvedValue({
      active: 0,
      completed: 5,
      failed: 1,
      delayed: 0,
      waiting: 2,
    });

    app = createApp();
  });

  afterAll(async () => {
    await databaseService.close();
    await redisService.close();
    await bullMQService.closeAllQueuesAndWorkers(500);
  });

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
    expect(res.body.message).toBeDefined();
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
    expect(res.body.message).toContain('not found');
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
