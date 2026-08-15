import { Queue, Worker, Job } from 'bullmq';
import { bullMQService, BullMQService } from '../../core/bullmq/bullmq.service.js';

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

let sampleQueueInstance: Queue<SampleJobData, SampleJobResult> | null = null;
let sampleWorkerInstance: Worker<SampleJobData, SampleJobResult> | null = null;

export const resetSampleQueueInstance = () => {
  sampleQueueInstance = null;
  sampleWorkerInstance = null;
};

export const getSampleQueue = (service: BullMQService = bullMQService): Queue<SampleJobData, SampleJobResult> => {
  if (!sampleQueueInstance) {
    const connection = service.getConnectionOptions();

    sampleQueueInstance = new Queue<SampleJobData, SampleJobResult>(SAMPLE_QUEUE_NAME, {
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
    });

    service.registerQueue(sampleQueueInstance);
  }
  return sampleQueueInstance;
};

export const initSampleWorker = (service: BullMQService = bullMQService): Worker<SampleJobData, SampleJobResult> => {
  if (!sampleWorkerInstance) {
    const connection = service.getConnectionOptions();

    sampleWorkerInstance = new Worker<SampleJobData, SampleJobResult>(
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
    );

    service.registerWorker(sampleWorkerInstance);

    sampleWorkerInstance.on('completed', (job: Job<SampleJobData, SampleJobResult>, result: SampleJobResult) => {
      console.log(`[SampleWorker] Job ${job.id} completed:`, result.message);
    });

    sampleWorkerInstance.on('failed', (job: Job<SampleJobData, SampleJobResult> | undefined, err: Error) => {
      console.warn(`[SampleWorker] Job ${job?.id} failed:`, err.message);
    });
  }
  return sampleWorkerInstance;
};
