import { JobsService } from '../../src/modules/jobs/jobs.service.js';
import { JobsModel } from '../../src/modules/jobs/jobs.model.js';
import { AppError } from '../../src/common/middleware/error.middleware.js';

describe('JobsService - Unit Tests', () => {
  let jobsService: JobsService;
  let mockModel: jest.Mocked<JobsModel>;

  beforeEach(() => {
    mockModel = {
      addJob: jest.fn(),
      findJobById: jest.fn(),
      getCounts: jest.fn(),
    } as any;

    jobsService = new JobsService(mockModel);
  });

  describe('enqueueJob()', () => {
    it('enqueues a job with priority and delay options', async () => {
      mockModel.addJob.mockResolvedValueOnce({
        id: 'job_123',
        queueName: 'sampleQueue',
        name: 'emailNotification',
        opts: { delay: 5000, attempts: 3 },
      } as any);

      const result = await jobsService.enqueueJob({
        type: 'emailNotification',
        payload: { to: 'user@api21.dev' },
        delay: 5000,
        priority: 1,
      });

      expect(result.success).toBe(true);
      expect(result.jobId).toBe('job_123');
      expect(result.type).toBe('emailNotification');
      expect(mockModel.addJob).toHaveBeenCalledWith(
        'emailNotification',
        expect.objectContaining({ type: 'emailNotification' }),
        { delay: 5000, priority: 1 }
      );
    });

    it('throws 400 when type is missing', async () => {
      await expect(jobsService.enqueueJob({} as any)).rejects.toThrow('Job type is required');
    });
  });

  describe('getJobStatus()', () => {
    it('returns formatted job lifecycle details', async () => {
      mockModel.findJobById.mockResolvedValueOnce({
        id: 'job_456',
        name: 'dataSync',
        queueName: 'sampleQueue',
        getState: jest.fn().mockResolvedValue('completed'),
        data: { count: 100 },
        returnvalue: { processed: 100 },
        failedReason: null,
        timestamp: 1600000000000,
        finishedOn: 1600000005000,
        attemptsMade: 1,
      } as any);

      const status = await jobsService.getJobStatus('job_456');
      expect(status.id).toBe('job_456');
      expect(status.state).toBe('completed');
      expect(status.returnvalue).toEqual({ processed: 100 });
    });

    it('throws 404 when job does not exist in queue', async () => {
      mockModel.findJobById.mockResolvedValueOnce(null as any);

      await expect(jobsService.getJobStatus('nonexistent')).rejects.toThrow('not found');
    });
  });

  describe('getQueueMetrics()', () => {
    it('returns queue counts', async () => {
      mockModel.getCounts.mockResolvedValueOnce({
        active: 2,
        completed: 50,
        failed: 1,
        delayed: 3,
        waiting: 5,
      });

      const metrics = await jobsService.getQueueMetrics();
      expect(metrics.active).toBe(2);
      expect(metrics.completed).toBe(50);
    });
  });
});
