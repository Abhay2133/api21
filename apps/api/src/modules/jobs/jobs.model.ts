import { Queue, Job } from 'bullmq';
import { getSampleQueue, SampleJobData, SampleJobResult } from './jobs.job.js';

export class JobsModel {
  private queue: Queue<SampleJobData, SampleJobResult>;

  constructor() {
    this.queue = getSampleQueue();
  }

  async addJob(type: string, payload: any, options: any): Promise<Job<SampleJobData, SampleJobResult>> {
    return this.queue.add(type, payload, options);
  }

  async findJobById(jobId: string): Promise<Job<SampleJobData, SampleJobResult> | undefined> {
    return this.queue.getJob(jobId);
  }

  async getCounts(): Promise<Record<string, number>> {
    return this.queue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting');
  }
}

export const jobsModel = new JobsModel();
