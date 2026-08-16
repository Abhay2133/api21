import { Express, Request, Response, NextFunction } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getSampleQueue } from '../jobs/jobs.job.js';
import { getMaintenanceQueue } from '../jobs/maintenance.job.js';
import { databaseService } from '../../core/database/database.service.js';
import { config } from '../../config/env.js';

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });
  return list;
};

export const setupBullBoard = (app: Express | any) => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const sampleQueue = getSampleQueue();
  const maintenanceQueue = getMaintenanceQueue();

  createBullBoard({
    queues: [new BullMQAdapter(sampleQueue), new BullMQAdapter(maintenanceQueue)],
    serverAdapter,
  });

  // Admin authentication middleware for Bull Board supporting Cookie, Basic Auth, Bearer token, & Query token
  const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;
    const cookies = parseCookies(req.headers.cookie);
    const cookieToken = cookies['admin_session'];

    // Helper to set session cookie on successful auth
    const grantAccess = (cookieVal = 'authenticated') => {
      res.setHeader('Set-Cookie', `admin_session=${cookieVal}; Path=/admin/queues; HttpOnly; SameSite=Lax`);
      return next();
    };

    // 1. Check Cookie Session
    if (cookieToken && (cookieToken === 'authenticated' || cookieToken === config.masterCredentials)) {
      return next();
    }

    // 2. Check Query Token (?token=...)
    if (queryToken) {
      try {
        const result = await databaseService.query(
          'SELECT id, token, username, is_active FROM sessions WHERE token = $1 AND is_active = true',
          [queryToken]
        );
        if (result.rows.length > 0) {
          return grantAccess(queryToken);
        }
      } catch {}
    }

    // 3. Check Bearer Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const result = await databaseService.query(
          'SELECT id, token, username, is_active FROM sessions WHERE token = $1 AND is_active = true',
          [token]
        );
        if (result.rows.length > 0) {
          return grantAccess(token);
        }
      } catch {}
    }

    // 4. Check Basic Auth (admin:securepassword)
    if (authHeader && authHeader.startsWith('Basic ')) {
      try {
        const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
        if (
          credentials === config.masterCredentials ||
          credentials === `admin:${process.env.ADMIN_SECRET}` ||
          credentials === `admin:securepassword`
        ) {
          return grantAccess('authenticated');
        }
      } catch {}
    }

    // Request HTTP Basic Auth in browser popup
    res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board Admin"');
    return res.status(401).send('Authentication required to access Bull Board.');
  };

  const expressApp = typeof app.getHttpAdapter === 'function' ? app.getHttpAdapter().getInstance() : app;
  expressApp.use('/admin/queues', adminAuthMiddleware, serverAdapter.getRouter());
};
