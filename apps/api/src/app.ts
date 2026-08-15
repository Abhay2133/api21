import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { loggingMiddleware } from './common/middleware/logging.middleware.js';
import { sslMiddleware } from './common/middleware/ssl.middleware.js';
import { rateLimitMiddleware } from './common/middleware/rate-limit.middleware.js';
import { errorHandler } from './common/middleware/error.middleware.js';
import { healthRouter } from './modules/health/health.controller.js';
import { usersRouter } from './modules/users/users.controller.js';
import { sessionsRouter } from './modules/sessions/sessions.controller.js';
import { jobsRouter } from './modules/jobs/jobs.controller.js';
import { webhooksRouter } from './modules/webhooks/webhooks.controller.js';
import { adminRouter } from './modules/admin/admin.controller.js';
import { setupBullBoard } from './modules/admin/bull-board.setup.js';

function resolveStaticDir(): string {
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, 'apps/api/dist/static'),
    path.resolve(cwd, 'apps/api/static'),
    path.resolve(cwd, 'dist/static'),
    path.resolve(cwd, 'static'),
  ];
  return candidates.find((p) => fs.existsSync(p)) || path.resolve(cwd, 'apps/api/static');
}

export const createApp = (): Express => {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(sslMiddleware);
  app.use(loggingMiddleware);
  app.use(rateLimitMiddleware);

  // Serve static interactive documentation
  const staticDir = resolveStaticDir();
  app.use(express.static(staticDir));
  app.get('/', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });

  // Mount Bull Board UI
  setupBullBoard(app);

  // Mount API v1 Modular Routers
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/sessions', sessionsRouter);
  app.use('/api/v1/jobs', jobsRouter);
  app.use('/api/v1/webhooks', webhooksRouter);
  app.use('/api/v1/admin', adminRouter);

  // 404 handler for API routes
  app.use('/api', (req, res) => {
    res.status(404).json({
      status: 'error',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Global Centralized Error Handler
  app.use(errorHandler);

  return app;
};
