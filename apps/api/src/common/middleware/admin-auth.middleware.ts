import { Request, Response, NextFunction } from 'express';
import { databaseService } from '../../core/database/database.service.js';

export interface AuthenticatedRequest extends Request {
  session?: {
    id: number;
    token: string;
    username: string;
    is_active: boolean;
  };
}

export const adminAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.substring(7);

  try {
    const result = await databaseService.query(
      'SELECT id, token, username, is_active FROM sessions WHERE token = $1 AND is_active = true',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized or expired session',
      });
    }

    req.session = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Failed to verify session',
    });
  }
};
