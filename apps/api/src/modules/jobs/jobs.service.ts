import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import { BullMQService } from '../../core/bullmq/bullmq.service.js';
import { getSampleQueue, SampleJobData, SampleJobResult } from './sample.queue.js';
import { EnqueueJobDto } from './dto/enqueue-job.dto.js';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private queue: Queue<SampleJobData, SampleJobResult>;
  private cachedMetrics: Record<string, number> | null = null;
  private lastMetricsFetchTime = 0;
  private readonly METRICS_CACHE_TTL_MS = 2500;

  constructor(private readonly bullmqService: BullMQService) {
    this.queue = getSampleQueue(this.bullmqService);
  }

  async enqueueJob(dto: EnqueueJobDto) {
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

      const job = await this.queue.add(dto.type || 'default', payload, options);

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
      this.logger.error('Error enqueuing job:', err);
      throw new InternalServerErrorException({ error: 'Failed to enqueue job', message: err.message });
    }
  }

  async getJobStatus(jobId: string) {
    if (!jobId) {
      throw new BadRequestException({ error: 'jobId parameter is required' });
    }

    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        throw new NotFoundException({ error: `Job with ID "${jobId}" not found` });
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
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error('Error getting job status:', err);
      throw new InternalServerErrorException({ error: 'Failed to fetch job status', message: err.message });
    }
  }

  async getQueueMetrics(): Promise<Record<string, number>> {
    const now = Date.now();
    if (this.cachedMetrics && now - this.lastMetricsFetchTime < this.METRICS_CACHE_TTL_MS) {
      return this.cachedMetrics;
    }

    try {
      const metricsPromise = this.queue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting');
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Redis metrics query timed out')), 2000);
      });

      const counts = await Promise.race([metricsPromise, timeoutPromise]);
      this.cachedMetrics = counts;
      this.lastMetricsFetchTime = Date.now();
      return counts;
    } catch (err) {
      this.logger.warn('Failed to fetch queue metrics or query timed out:', err);
      if (this.cachedMetrics) {
        return this.cachedMetrics;
      }
      return { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0 };
    }
  }
}
