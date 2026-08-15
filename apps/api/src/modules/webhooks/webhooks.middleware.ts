import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/env.js';

export const validateDeployToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.query.token as string | undefined;
  if (!token || token !== config.deployCiToken) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Invalid or missing deployment token',
    });
  }
  next();
};
