import { INestApplication } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getSampleQueue } from '../jobs/sample.queue.js';
import { DatabaseService } from '../../core/database/database.service.js';
import { config } from '../../config/env.js';
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

  // Admin authentication middleware for Bull Board supporting HTTP Basic Auth, Bearer token, & Query token
  const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;

    // 1. Check Query Token (?token=...)
    if (queryToken) {
      try {
        const result = await databaseService.query(
          'SELECT id, token, username, is_active FROM sessions WHERE token = $1 AND is_active = true',
          [queryToken]
        );
        if (result.rows.length > 0) {
          return next();
        }
      } catch {}
    }

    // 2. Check Bearer Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const result = await databaseService.query(
          'SELECT id, token, username, is_active FROM sessions WHERE token = $1 AND is_active = true',
          [token]
        );
        if (result.rows.length > 0) {
          return next();
        }
      } catch {}
    }

    // 3. Check Basic Auth (admin:securepassword)
    if (authHeader && authHeader.startsWith('Basic ')) {
      try {
        const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
        if (
          credentials === config.masterCredentials ||
          credentials === `admin:${process.env.ADMIN_SECRET}` ||
          credentials === `admin:securepassword`
        ) {
          return next();
        }
      } catch {}
    }

    // Request HTTP Basic Auth in browser popup
    res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board Admin"');
    return res.status(401).send('Authentication required to access Bull Board.');
  };

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use('/admin/queues', adminAuthMiddleware, serverAdapter.getRouter());
};
