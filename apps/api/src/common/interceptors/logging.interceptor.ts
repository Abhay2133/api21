import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { config } from '../../config/env.js';

export const maskSensitiveData = (message: string): string => {
  if (!message || typeof message !== 'string') return message;

  // 1. Always mask token query parameter in URLs
  let sanitized = message.replace(/([?&]token=)[^&]*/gi, '$1***');

  // 2. In production environment, mask environment variables and credentials
  if (config.isProduction || process.env.NODE_ENV === 'production') {
    sanitized = sanitized.replace(/((?:postgres|postgresql|mongodb|mysql|redis):\/\/[^:]+:)[^@]+(@)/gi, '$1***$2');
    sanitized = sanitized.replace(/(redis:\/\/:)[^@]+(@)/gi, '$1***$2');

    const sensitiveValues = new Set<string>();

    if (config.databaseUrl) sensitiveValues.add(config.databaseUrl);
    if (config.redisUrl) sensitiveValues.add(config.redisUrl);
    if (config.masterCredentials) sensitiveValues.add(config.masterCredentials);
    if (config.deployCiToken) sensitiveValues.add(config.deployCiToken);

    const sensitiveKeys = [
      'DATABASE_URL',
      'REDIS_URL',
      'MASTER_CREDENTIALS',
      'DEPLOY_CI_TOKEN',
      'JWT_SECRET',
      'SECRET',
      'PASSWORD',
      'TOKEN',
      'KEY',
      'AUTH',
      'CREDENTIALS',
      'PORT',
    ];

    for (const key of Object.keys(process.env)) {
      const upperKey = key.toUpperCase();
      if (sensitiveKeys.some((k) => upperKey.includes(k))) {
        const val = process.env[key];
        if (val && val.trim().length > 0) {
          sensitiveValues.add(val);
        }
      }
    }

    for (const val of sensitiveValues) {
      if (val && val.length > 0) {
        const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        sanitized = sanitized.replace(new RegExp(escaped, 'g'), '***');
      }
    }
  }

  return sanitized;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const startTime = Date.now();
    const { method, originalUrl } = req;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;
          const sanitizedUrl = maskSensitiveData(originalUrl);
          const logLine = maskSensitiveData(`[HTTP] ${method} ${sanitizedUrl} ${statusCode} - ${duration}ms - IP: ${ip}`);
          console.log(logLine);
        },
        error: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode || 500;
          const sanitizedUrl = maskSensitiveData(originalUrl);
          const logLine = maskSensitiveData(`[HTTP] ${method} ${sanitizedUrl} ${statusCode} - ${duration}ms - IP: ${ip}`);
          console.log(logLine);
        },
      })
    );
  }
}
