import { Request, Response, NextFunction } from 'express';
import { rateLimitMiddleware } from '../../src/common/middleware/rate-limit.middleware.js';
import { redisService } from '../../src/core/redis/redis.service.js';

describe('RateLimitMiddleware - Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      ip: '203.0.113.195',
      socket: { remoteAddress: '203.0.113.195' } as any,
      headers: {},
      originalUrl: '/api/v1/users',
    };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterAll(async () => {
    await redisService.close();
  });

  it('bypasses non-api routes immediately', async () => {
    req.originalUrl = '/health';
    await rateLimitMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows request when client is within rate limits', async () => {
    await rateLimitMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });
});
