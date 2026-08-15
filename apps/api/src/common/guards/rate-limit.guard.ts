import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { RedisService } from '../../core/redis/redis.service.js';

const WINDOW_SIZE_IN_SECONDS = 15 * 60; // 15 minutes
const MAX_REQUESTS = 200;

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse<Response>();

    // Apply rate limiting specifically to /api/v1 routes
    const path = req.originalUrl || req.url || '';
    if (!path.startsWith('/api/v1')) {
      return true;
    }

    const redis = this.redisService.getClient();
    if (!redis || redis.status !== 'ready') {
      return true;
    }

    try {
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const key = `ratelimit:${ip}`;
      const now = Date.now();
      const windowStart = now - WINDOW_SIZE_IN_SECONDS * 1000;

      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, now, `${now}-${Math.random()}`);
      multi.zcard(key);
      multi.expire(key, WINDOW_SIZE_IN_SECONDS);

      const results = await multi.exec();
      if (results && results[2] && typeof results[2][1] === 'number') {
        const requestCount = results[2][1];
        res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - requestCount));

        if (requestCount > MAX_REQUESTS) {
          throw new HttpException(
            {
              status: 'error',
              error: 'Too Many Requests',
              message: 'Rate limit exceeded. Please try again later.',
            },
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
      }
      return true;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.warn(`Rate limit guard error, bypassing: ${err}`);
      return true;
    }
  }
}
