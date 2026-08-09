import { Router } from 'express';
import { handleDeployWebhook } from '../controllers/webhookController.js';

const webhookRouter: Router = Router();

webhookRouter.post('/deploy', handleDeployWebhook);

export default webhookRouter;
