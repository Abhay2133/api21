import { Request, Response, NextFunction } from 'express';
import { CreateSessionDto } from '@api21/types';
import { validateBody } from '../../common/middleware/validation.middleware.js';

export const validateCreateSession = validateBody(CreateSessionDto);

export interface RequestWithClientMeta extends Request {
  clientIp?: string;
  clientUserAgent?: string;
}

export const extractClientMetadata = (req: RequestWithClientMeta, res: Response, next: NextFunction) => {
  req.clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  req.clientUserAgent = (req.headers['user-agent'] as string) || 'Unknown';
  next();
};
