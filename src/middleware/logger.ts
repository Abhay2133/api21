import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

/**
 * Masks sensitive values in log messages.
 * - Always masks query parameter tokens (e.g., ?token=...)
 * - In production mode, masks all sensitive environment variables and connection string credentials.
 */
export const maskSensitiveData = (message: string): string => {
  if (!message || typeof message !== 'string') return message;

  // 1. Always mask token query parameter in URLs
  let sanitized = message.replace(/([?&]token=)[^&]*/gi, '$1***');

  // 2. In production environment, mask environment variables and credentials
  if (config.isProduction || process.env.NODE_ENV === 'production') {
    // Mask passwords in database/redis connection strings (e.g., postgres://user:pass@host, redis://:pass@host)
    sanitized = sanitized.replace(/((?:postgres|postgresql|mongodb|mysql|redis):\/\/[^:]+:)[^@]+(@)/gi, '$1***$2');
    sanitized = sanitized.replace(/(redis:\/\/:)[^@]+(@)/gi, '$1***$2');

    const sensitiveValues = new Set<string>();

    // Add explicit config secret values
    if (config.databaseUrl) sensitiveValues.add(config.databaseUrl);
    if (config.redisUrl) sensitiveValues.add(config.redisUrl);
    if (config.masterCredentials) sensitiveValues.add(config.masterCredentials);
    if (config.deployCiToken) sensitiveValues.add(config.deployCiToken);

    // Filter sensitive keys from process.env
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

    // Replace occurrences of sensitive environment variable values with ***
    for (const val of sensitiveValues) {
      if (val && val.length > 0) {
        const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        sanitized = sanitized.replace(new RegExp(escaped, 'g'), '***');
      }
    }
  }

  return sanitized;
};

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, originalUrl } = req;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const sanitizedUrl = maskSensitiveData(originalUrl);
    const logLine = maskSensitiveData(`[HTTP] ${method} ${sanitizedUrl} ${statusCode} - ${duration}ms - IP: ${ip}`);
    console.log(logLine);
  });

  next();
};

