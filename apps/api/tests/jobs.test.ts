import request from 'supertest';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { createNestApp } from '../src/app.factory.js';
import { DatabaseService } from '../src/core/database/database.service.js';
import { JobsService } from '../src/modules/jobs/jobs.service.js';

describe('Job Queues Endpoints', () => {
  let app: INestApplication;
  let httpServer: any;

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
    jest.spyOn(DatabaseService.prototype, 'onModuleInit').mockResolvedValue(undefined as any);

    jest.spyOn(JobsService.prototype, 'enqueueJob').mockImplementation(async (dto: any) => {
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

    jest.spyOn(JobsService.prototype, 'getJobStatus').mockImplementation(async (jobId: string) => {
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
      throw new NotFoundException({ error: `Job with ID "${jobId}" not found` });
    });

    jest.spyOn(JobsService.prototype, 'getQueueMetrics').mockResolvedValue({
      active: 0,
      completed: 5,
      failed: 1,
      delayed: 0,
      waiting: 2,
    });

    app = await createNestApp();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST /api/v1/jobs should enqueue a valid job', async () => {
    const res = await request(httpServer)
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
    const res = await request(httpServer).post('/api/v1/jobs').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('GET /api/v1/jobs/:jobId should return job details and state', async () => {
    const res = await request(httpServer).get('/api/v1/jobs/job-12345');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('job-12345');
    expect(res.body.state).toBe('completed');
    expect(res.body.returnvalue.success).toBe(true);
  });

  it('GET /api/v1/jobs/:jobId for non-existent job should return 404', async () => {
    const res = await request(httpServer).get('/api/v1/jobs/non-existent-job');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  it('GET /api/v1/jobs/metrics should return queue counts', async () => {
    const res = await request(httpServer).get('/api/v1/jobs/metrics');

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
