import { INestApplication } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getSampleQueue } from '../jobs/sample.queue.js';
import { DatabaseService } from '../../core/database/database.service.js';
import { Request, Response, NextFunction } from 'express';

export const setupBullBoard = (app: INestApplication) => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const sampleQueue = getSampleQueue();

  createBullBoard({
    queues: [new BullMQAdapter(sampleQueue)],
    serverAdapter,
  });

  const databaseService = app.get(DatabaseService);

  // Admin session authentication middleware for Bull Board
  const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.substring(7);
    try {
      const result = await databaseService.query(
        'SELECT id, token, username, is_active FROM sessions WHERE token = $1 AND is_active = true',
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized or expired session' });
      }

      next();
    } catch (err) {
      res.status(500).json({ status: 'error', message: 'Failed to verify session' });
    }
  };

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use('/admin/queues', adminAuthMiddleware, serverAdapter.getRouter());
};
