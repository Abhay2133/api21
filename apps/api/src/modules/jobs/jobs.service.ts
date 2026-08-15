import { EnqueueJobDto } from '@api21/types';
import { jobsModel, JobsModel } from './jobs.model.js';
import { SampleJobData } from './jobs.job.js';
import { AppError } from '../../common/middleware/error.middleware.js';

export class JobsService {
  private cachedMetrics: Record<string, number> | null = null;
  private lastMetricsFetchTime = 0;
  private readonly METRICS_CACHE_TTL_MS = 2500;

  constructor(private readonly model: JobsModel = jobsModel) {}

  async enqueueJob(dto: EnqueueJobDto) {
    if (!dto || !dto.type) {
      throw new AppError('Job type is required', 400);
    }

    try {
      const options: any = {};
      if (typeof dto.delay === 'number' && dto.delay > 0) {
        options.delay = dto.delay;
      }
      if (typeof dto.priority === 'number') {
        options.priority = dto.priority;
      }

      const payload: SampleJobData = {
        type: dto.type,
        payload: dto.payload,
        timestamp: new Date().toISOString(),
      };

      const job = await this.model.addJob(dto.type || 'default', payload, options);

      return {
        success: true,
        message: 'Job enqueued successfully',
        jobId: job.id,
        queue: job.queueName,
        type: job.name,
        opts: {
          delay: job.opts.delay || 0,
          attempts: job.opts.attempts,
        },
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(`Failed to enqueue job: ${err.message}`, 500);
    }
  }

  async getJobStatus(jobId: string) {
    if (!jobId) {
      throw new AppError('jobId parameter is required', 400);
    }

    try {
      const job = await this.model.findJobById(jobId);
      if (!job) {
        throw new AppError(`Job with ID "${jobId}" not found`, 404);
      }

      const state = await job.getState();

      return {
        id: job.id,
        name: job.name,
        queue: job.queueName,
        state,
        data: job.data,
        returnvalue: job.returnvalue || null,
        failedReason: job.failedReason || null,
        timestamp: job.timestamp,
        finishedOn: job.finishedOn || null,
        attemptsMade: job.attemptsMade,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(`Failed to fetch job status: ${err.message}`, 500);
    }
  }

  async getQueueMetrics(): Promise<Record<string, number>> {
    const now = Date.now();
    if (this.cachedMetrics && now - this.lastMetricsFetchTime < this.METRICS_CACHE_TTL_MS) {
      return this.cachedMetrics;
    }

    try {
      const metricsPromise = this.model.getCounts();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Redis metrics query timed out')), 2000);
      });

      const counts = await Promise.race([metricsPromise, timeoutPromise]);
      this.cachedMetrics = counts;
      this.lastMetricsFetchTime = Date.now();
      return counts;
    } catch (err) {
      console.warn('Failed to fetch queue metrics or query timed out:', err);
      if (this.cachedMetrics) {
        return this.cachedMetrics;
      }
      return { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0 };
    }
  }
}

export const jobsService = new JobsService();
