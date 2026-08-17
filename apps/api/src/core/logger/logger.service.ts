import { Logtail } from '@logtail/node';
import { config } from '../../config/env.js';
import { maskSensitiveData } from '../../common/middleware/logging.middleware.js';

export class LoggerService {
  private logtail: Logtail | null = null;

  constructor() {
    if (config.betterStackSourceToken) {
      try {
        const options: Record<string, any> = {};
        if (config.betterStackIngestingHost) {
          options.endpoint = config.betterStackIngestingHost;
        }
        this.logtail = new Logtail(config.betterStackSourceToken, options);
      } catch (err) {
        console.warn('[LoggerService] Failed to initialize Better Stack Logtail client:', err);
      }
    }
  }

  public info(message: string, context?: Record<string, any>): void {
    const sanitizedMsg = maskSensitiveData(message);
    console.log(sanitizedMsg);
    if (this.logtail) {
      this.logtail.info(sanitizedMsg, this.sanitizeContext(context)).catch(() => {});
    }
  }

  public warn(message: string, context?: Record<string, any>): void {
    const sanitizedMsg = maskSensitiveData(message);
    console.warn(sanitizedMsg);
    if (this.logtail) {
      this.logtail.warn(sanitizedMsg, this.sanitizeContext(context)).catch(() => {});
    }
  }

  public error(message: string, error?: any, context?: Record<string, any>): void {
    const sanitizedMsg = maskSensitiveData(message);
    if (error) {
      console.error(sanitizedMsg, error);
    } else {
      console.error(sanitizedMsg);
    }
    if (this.logtail) {
      const errContext = error instanceof Error
        ? { name: error.name, message: maskSensitiveData(error.message), stack: error.stack, ...context }
        : { error, ...context };
      this.logtail.error(sanitizedMsg, this.sanitizeContext(errContext)).catch(() => {});
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    const sanitizedMsg = maskSensitiveData(message);
    if (!config.isProduction) {
      console.debug(sanitizedMsg);
    }
    if (this.logtail) {
      this.logtail.debug(sanitizedMsg, this.sanitizeContext(context)).catch(() => {});
    }
  }

  public http(message: string, context?: Record<string, any>): void {
    const sanitizedMsg = maskSensitiveData(message);
    console.log(sanitizedMsg);
    if (this.logtail) {
      this.logtail.info(sanitizedMsg, this.sanitizeContext({ type: 'http_request', ...context })).catch(() => {});
    }
  }

  public async flush(): Promise<void> {
    if (this.logtail) {
      try {
        await this.logtail.flush();
      } catch {}
    }
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') {
        sanitized[key] = maskSensitiveData(value);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

export const logger = new LoggerService();
