import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { logger } from '../../core/logger/logger.service.js';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error(`[Error] ${req.method} ${req.originalUrl}:`, err, {
      path: req.originalUrl,
      method: req.method,
      statusCode,
    });
    Sentry.captureException(err);
  }

  const sentryId = (res as any).sentry;

  return res.status(statusCode).json({
    status: 'error',
    message,
    ...(sentryId ? { sentryId } : {}),
    ...(err.details ? { details: err.details } : {}),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};
