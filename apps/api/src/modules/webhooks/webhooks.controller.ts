import { Router, Request, Response, NextFunction } from 'express';
import { webhooksService } from './webhooks.service.js';
import { validateDeployToken } from './webhooks.middleware.js';

const router: Router = Router();

// POST /api/v1/webhooks/deploy - Trigger CI/CD zero-downtime redeployment
router.post('/deploy', validateDeployToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token as string | undefined;
    const result = await webhooksService.handleDeployWebhook(token);
    return res.status(202).json(result);
  } catch (err) {
    next(err);
  }
});

export const webhooksRouter: Router = router;
