import { Request, Response, NextFunction } from 'express';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, originalUrl } = req;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    console.log(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms - IP: ${ip}`);
  });

  next();
};
