import express from 'express';
import path from 'path';
import { corsMiddleware } from './middleware/cors.js';
import { loggerMiddleware } from './middleware/logger.js';
import { sslMiddleware } from './middleware/ssl.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { errorHandlerMiddleware } from './middleware/errorHandler.js';
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

  // API router with rate limiting
  app.use('/api/v1', rateLimitMiddleware, apiRouter);

  // Global Error Handler
  app.use(errorHandlerMiddleware);

  return app;
};
