import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import userRoutes from './userRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import jobRoutes from './jobRoutes.js';
import webhookRoutes from './webhookRoutes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/sessions', sessionRoutes);
apiRouter.use('/jobs', jobRoutes);
apiRouter.use('/webhooks', webhookRoutes);

export default apiRouter;

