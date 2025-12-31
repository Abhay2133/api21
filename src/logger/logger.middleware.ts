import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const hr = new Date().getHours();
    const min = new Date().getMinutes();
    const sec = new Date().getSeconds();
    console.log(
      `${res.statusCode} ${req.method} ${req.url} ${hr}:${min}:${sec}`,
    );
    next();
  }
}
