import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/env.js';
import { adminModel } from './admin.model.js';
import { Session } from '@api21/types';

export interface AdminRequest extends Request {
  adminSession?: Session;
}

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

export const adminGuard = async (req: AdminRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies['admin_session'];
  const token =
    (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined) ||
    (req.query.token as string) ||
    (cookieToken && cookieToken !== 'authenticated' ? cookieToken : undefined);

  if (token) {
    try {
      const session = await adminModel.findSessionByToken(token);
      if (session) {
        req.adminSession = session;
        return next();
      }
    } catch {}
  }

  // Check HTTP Basic Auth (admin:securepassword)
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
      if (
        credentials === config.masterCredentials ||
        credentials === `admin:${process.env.ADMIN_SECRET}` ||
        credentials === `admin:securepassword`
      ) {
        req.adminSession = {
          id: 0,
          token: 'basic-auth',
          username: 'admin',
          is_active: true,
          expires_at: new Date(Date.now() + 86400000),
        };
        return next();
      }
    } catch {}
  }

  return res.status(401).json({
    status: 'error',
    message: 'Admin authorization required',
  });
};
