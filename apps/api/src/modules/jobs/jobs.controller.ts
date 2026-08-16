import { Router, Request, Response, NextFunction } from 'express';
import { jobsService } from './jobs.service.js';
import { validateEnqueueJob, validateJobIdParam } from './jobs.middleware.js';

const router: Router = Router();

// POST /api/v1/jobs - Enqueue background job
router.post('/', validateEnqueueJob, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await jobsService.enqueueJob(req.body);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/jobs/metrics - Retrieve queue metrics
router.get('/metrics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await jobsService.getQueueMetrics();
    return res.status(200).json({
      queue: 'sampleQueue',
      metrics,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/jobs/:jobId - Get job status and results
router.get('/:jobId', validateJobIdParam, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await jobsService.getJobStatus(req.params.jobId);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export const jobsRouter: Router = router;
