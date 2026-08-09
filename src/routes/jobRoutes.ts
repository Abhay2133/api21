import { Router } from 'express';
import { enqueueJob, getJobStatus, getQueueMetrics } from '../controllers/jobController.js';

const router = Router();

router.post('/', enqueueJob);
router.get('/metrics', getQueueMetrics);
router.get('/:jobId', getJobStatus);

export default router;
