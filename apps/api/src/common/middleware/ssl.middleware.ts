import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/env.js';

export const sslMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (config.isProduction && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
};
