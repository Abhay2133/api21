import { Request, Response, NextFunction } from 'express';
import { redisService } from '../../core/redis/redis.service.js';

const WINDOW_SIZE_IN_SECONDS = 15 * 60; // 15 minutes
const MAX_REQUESTS = 1000;

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Apply rate limiting specifically to /api/v1 routes
  const path = req.originalUrl || req.url || '';
  if (!path.startsWith('/api/v1')) {
    return next();
  }

  const redis = redisService.getClient();
  if (!redis || redis.status !== 'ready') {
    return next();
  }

  try {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    
    // In local development/testing, do not throttle localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || process.env.NODE_ENV === 'test') {
      return next();
    }

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
        return res.status(429).json({
          status: 'error',
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
        });
      }
    }
    next();
  } catch (err) {
    console.warn(`Rate limit middleware error, bypassing: ${err}`);
    next();
  }
};
