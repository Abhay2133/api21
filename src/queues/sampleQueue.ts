import { Queue, Worker, JobsOptions, Job } from 'bullmq';
import { getBullMQConnectionOptions, registerQueue, registerWorker } from '../config/bullmq.js';

export interface SampleJobData {
  type: string;
  payload?: Record<string, any>;
  timestamp?: string;
}

export interface SampleJobResult {
  success: boolean;
  processedAt: string;
  message: string;
}

export const SAMPLE_QUEUE_NAME = 'sampleQueue';

const connection = getBullMQConnectionOptions();

export const sampleQueue = registerQueue(
  new Queue<SampleJobData, SampleJobResult>(SAMPLE_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  })
);

let sampleWorkerInstance: Worker<SampleJobData, SampleJobResult> | null = null;

export const initSampleWorker = (): Worker<SampleJobData, SampleJobResult> => {
  if (!sampleWorkerInstance) {
    sampleWorkerInstance = registerWorker(
      new Worker<SampleJobData, SampleJobResult>(
        SAMPLE_QUEUE_NAME,
        async (job: Job<SampleJobData, SampleJobResult>): Promise<SampleJobResult> => {
          console.log(`[SampleWorker] Processing job ${job.id} of type "${job.data.type}"`);

          if (job.data.type === 'fail') {
            throw new Error(`Job ${job.id} deliberately failed for testing.`);
          }

          return {
            success: true,
            processedAt: new Date().toISOString(),
            message: `Successfully processed task of type "${job.data.type}"`,
          };
        },
        { connection, concurrency: 5 }
      )
    );

    sampleWorkerInstance.on('completed', (job: Job<SampleJobData, SampleJobResult>, result: SampleJobResult) => {
      console.log(`[SampleWorker] Job ${job.id} completed:`, result.message);
    });

    sampleWorkerInstance.on('failed', (job: Job<SampleJobData, SampleJobResult> | undefined, err: Error) => {
      console.warn(`[SampleWorker] Job ${job?.id} failed:`, err.message);
    });
  }
  return sampleWorkerInstance;
};

export const addSampleJob = async (
  data: SampleJobData,
  options?: JobsOptions
): Promise<Job<SampleJobData, SampleJobResult>> => {
  const payload: SampleJobData = {
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
  };
  return sampleQueue.add(data.type || 'default', payload, options);
};

export const getSampleJob = async (
  jobId: string
): Promise<Job<SampleJobData, SampleJobResult> | undefined> => {
  const job = await sampleQueue.getJob(jobId);
  return job || undefined;
};

let cachedMetrics: Record<string, number> | null = null;
let lastMetricsFetchTime = 0;
const METRICS_CACHE_TTL_MS = 2500;

export const getSampleQueueMetrics = async (): Promise<Record<string, number>> => {
  const now = Date.now();
  if (cachedMetrics && now - lastMetricsFetchTime < METRICS_CACHE_TTL_MS) {
    return cachedMetrics;
  }

  try {
    const metricsPromise = sampleQueue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting');
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Redis metrics query timed out')), 2000);
    });

    const counts = await Promise.race([metricsPromise, timeoutPromise]);
    cachedMetrics = counts;
    lastMetricsFetchTime = Date.now();
    return counts;
  } catch (err) {
    console.warn('[SampleQueue] Failed to fetch queue metrics or query timed out:', err);
    if (cachedMetrics) {
      return cachedMetrics;
    }
    return { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0 };
  }
};

