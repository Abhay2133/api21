import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import userRoutes from './userRoutes.js';
import sessionRoutes from './sessionRoutes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/sessions', sessionRoutes);

export default apiRouter;
