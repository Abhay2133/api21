import { Request, Response, NextFunction } from 'express';
import { CreateUserDto } from '@api21/types';
import { validateBody } from '../../common/middleware/validation.middleware.js';

export const validateCreateUser = validateBody(CreateUserDto);

export const validateUserIdParam = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID must be a positive integer',
    });
  }
  next();
};
