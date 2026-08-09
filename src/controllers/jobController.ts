import { Request, Response } from 'express';
import { addSampleJob, getSampleJob, getSampleQueueMetrics } from '../queues/sampleQueue.js';

export const enqueueJob = async (req: Request, res: Response) => {
  try {
    const { type, payload, delay, priority } = req.body;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Job "type" (string) is required' });
    }

    const options: any = {};
    if (typeof delay === 'number' && delay > 0) {
      options.delay = delay;
    }
    if (typeof priority === 'number') {
      options.priority = priority;
    }

    const job = await addSampleJob({ type, payload }, options);

    return res.status(201).json({
      success: true,
      message: 'Job enqueued successfully',
      jobId: job.id,
      queue: job.queueName,
      type: job.name,
      opts: {
        delay: job.opts.delay || 0,
        attempts: job.opts.attempts,
      },
    });
  } catch (err: any) {
    console.error('[JobController] Error enqueuing job:', err);
    return res.status(500).json({ error: 'Failed to enqueue job', message: err.message });
  }
};

export const getJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ error: 'jobId parameter is required' });
    }

    const job = await getSampleJob(jobId);
    if (!job) {
      return res.status(404).json({ error: `Job with ID "${jobId}" not found` });
    }

    const state = await job.getState();

    return res.status(200).json({
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
    });
  } catch (err: any) {
    console.error('[JobController] Error getting job status:', err);
    return res.status(500).json({ error: 'Failed to fetch job status', message: err.message });
  }
};

export const getQueueMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = await getSampleQueueMetrics();
    return res.status(200).json({
      queue: 'sampleQueue',
      metrics,
    });
  } catch (err: any) {
    console.error('[JobController] Error fetching queue metrics:', err);
    return res.status(500).json({ error: 'Failed to fetch queue metrics', message: err.message });
  }
};
