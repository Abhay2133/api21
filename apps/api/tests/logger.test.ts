import { maskSensitiveData } from '../src/common/middleware/logging.middleware.js';
import { LoggerService, logger } from '../src/core/logger/logger.service.js';
import { config } from '../src/config/env.js';

describe('Logger Masking and Better Stack Integration', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('maskSensitiveData', () => {
    it('should mask the deploy token in query parameters', () => {
      const input = '/api/v1/webhooks/deploy?token=secret-ci-token';
      const output = maskSensitiveData(input);
      expect(output).toBe('/api/v1/webhooks/deploy?token=***');
      expect(output).not.toContain('secret-ci-token');
    });

    it('should mask token along with other query params', () => {
      const input = '/api/v1/webhooks/deploy?token=mysecret123&foo=bar';
      const output = maskSensitiveData(input);
      expect(output).toBe('/api/v1/webhooks/deploy?token=***&foo=bar');
    });

    it('should mask environment variable secrets in production mode', () => {
      process.env.NODE_ENV = 'production';
      process.env.TEST_SECRET_KEY = 'super-secret-production-password';

      const input = `Server connected with secret: super-secret-production-password and token ${config.deployCiToken}`;
      const output = maskSensitiveData(input);

      expect(output).not.toContain('super-secret-production-password');
      expect(output).not.toContain(config.deployCiToken);
      expect(output).toContain('***');

      delete process.env.TEST_SECRET_KEY;
    });

    it('should mask database password in production mode', () => {
      process.env.NODE_ENV = 'production';

      const input = 'Connecting to postgres://admin:dbsecretpassword@localhost:5432/apps21';
      const output = maskSensitiveData(input);

      expect(output).not.toContain('dbsecretpassword');
      expect(output).toContain('postgres://admin:***@localhost:5432/apps21');
    });
  });

  describe('LoggerService', () => {
    it('should instantiate and log without throwing errors', () => {
      const instance = new LoggerService();
      expect(() => {
        instance.info('Test info message', { meta: 'value' });
        instance.warn('Test warn message');
        instance.error('Test error message', new Error('sample failure'));
        instance.http('[HTTP] GET /api/v1/health 200 - 5ms', { path: '/api/v1/health' });
      }).not.toThrow();
    });

    it('should export singleton logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });
});
