import express from 'express';
import path from 'path';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { corsMiddleware } from './middleware/cors.js';
import { loggerMiddleware } from './middleware/logger.js';
import { sslMiddleware } from './middleware/ssl.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { errorHandlerMiddleware } from './middleware/errorHandler.js';
import { adminAuthMiddleware } from './middleware/adminAuth.js';
import { sampleQueue } from './queues/sampleQueue.js';
import apiRouter from './routes/index.js';

export const createApp = (): express.Application => {
  const app = express();

  // Core middlewares
  app.use(sslMiddleware);
  app.use(corsMiddleware);
  app.use(loggerMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static HTML documentation served at root /
  const staticPath = path.resolve(process.cwd(), 'static');
  app.use(express.static(staticPath));

  app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  // BullMQ Bull Board Admin UI Dashboard
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(sampleQueue)],
    serverAdapter: serverAdapter,
  });

  app.use('/admin/queues', adminAuthMiddleware, serverAdapter.getRouter());

  // API router with rate limiting
  app.use('/api/v1', rateLimitMiddleware, apiRouter);

  // Global Error Handler
  app.use(errorHandlerMiddleware);

  return app;
};

