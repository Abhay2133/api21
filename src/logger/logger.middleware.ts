import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const it = Date.now();
    res.on('close', () => {
      console.debug(
        `[${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' })}] ${res.statusCode} ${req.method} ${req.url} ${Date.now() - it}ms`,
      );
    });
    next();
  }
}
