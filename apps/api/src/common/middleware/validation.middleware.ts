import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export function validateBody<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(dtoClass, req.body || {});
    const errors: ValidationError[] = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      const formattedErrors = errors.map((err) => {
        return {
          field: err.property,
          constraints: err.constraints,
        };
      });
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    req.body = dtoInstance;
    next();
  };
}

export function validateQuery<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(dtoClass, req.query || {});
    const errors: ValidationError[] = await validate(dtoInstance, {
      whitelist: true,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Query parameter validation failed',
        errors: errors.map((err) => ({ field: err.property, constraints: err.constraints })),
      });
    }

    req.query = dtoInstance as any;
    next();
  };
}
