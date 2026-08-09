import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis.js';


const WINDOW_SIZE_IN_SECONDS = 15 * 60; // 15 minutes
const MAX_REQUESTS = 200;

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const redis = getRedisClient();
  if (!redis || redis.status !== 'ready') {
    return next();
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
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
    console.warn('[RateLimit] Middleware error, bypassing rate limiting:', err);
    next();
  }
};
