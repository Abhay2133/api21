import { Router, Request, Response, NextFunction } from 'express';
import { healthService } from './health.service.js';
import { healthNoCacheMiddleware } from './health.middleware.js';

const router = Router();

// GET /api/v1/health - System health check
router.get('/', healthNoCacheMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await healthService.getHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(health);
  } catch (err) {
    next(err);
  }
});

export const healthRouter = router;
