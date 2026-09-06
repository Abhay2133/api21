import { Request, Response, NextFunction } from 'express';
import { adminModel } from './admin.model.js';
import { Session } from '@apps21/types';

export interface AdminRequest extends Request {
  adminSession?: Session;
}

export const parseCookies = (cookieHeader?: string): Record<string, string> => {
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
  const cookies = parseCookies(req.headers.cookie);
  const cookieSession = cookies['admin_session'];
  
  // Extract token from cookie (primary) or query fallback
  const token = cookieSession || (req.query.token as string);

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Admin authorization required: missing admin_session cookie',
    });
  }

  try {
    const session = await adminModel.findSessionByToken(token);
    if (!session) {
      return res.status(401).json({
        status: 'error',
        message: 'Admin session invalid or expired',
      });
    }

    req.adminSession = session;

    // Double Submit Cookie CSRF validation for mutating methods
    const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (mutatingMethods.includes(req.method.toUpperCase())) {
      const csrfHeader = (req.headers['x-csrf-token'] as string) || (req.headers['x-xsrf-token'] as string);
      const csrfCookie = cookies['csrf_token'];

      if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        return res.status(403).json({
          status: 'error',
          message: 'CSRF token verification failed: X-CSRF-Token header does not match csrf_token cookie',
        });
      }
    }

    return next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Failed to authenticate admin session',
    });
  }
};
