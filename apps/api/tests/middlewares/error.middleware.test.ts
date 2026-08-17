import { Request, Response, NextFunction } from 'express';
import { AppError, errorHandler } from '../../src/common/middleware/error.middleware.js';

describe('ErrorMiddleware - Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/v1/unknown',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('errorHandler maps AppError status code and message correctly', () => {
    const customError = new AppError('Conflict detected', 409);
    errorHandler(customError, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Conflict detected',
      })
    );
  });

  it('errorHandler handles error details when present', () => {
    const customError = new AppError('Validation failed', 400, { field: 'email' });
    errorHandler(customError, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Validation failed',
        details: { field: 'email' },
      })
    );
  });

  it('errorHandler captures unhandled 500 errors and includes sentryId if present', () => {
    (res as any).sentry = 'test-sentry-event-id-123';
    const serverError = new Error('Unexpected crash');
    errorHandler(serverError, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Unexpected crash',
        sentryId: 'test-sentry-event-id-123',
      })
    );
  });
});
