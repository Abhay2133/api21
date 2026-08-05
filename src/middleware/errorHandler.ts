import { Request, Response, NextFunction } from 'express';

export const errorHandlerMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error] Unhandled application error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
};
