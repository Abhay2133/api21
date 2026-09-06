import { Request, Response, NextFunction } from 'express';
import { EnqueueJobDto } from '@apps21/types';
import { validateBody } from '../../common/middleware/validation.middleware.js';

export const validateEnqueueJob = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || !req.body.type || typeof req.body.type !== 'string' || req.body.type.trim().length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Property "type" is required and must be a non-empty string',
    });
  }
  return validateBody(EnqueueJobDto)(req, res, next);
};

export const validateJobIdParam = (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;
  if (!jobId || jobId.trim().length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Job ID parameter is required',
    });
  }
  next();
};
