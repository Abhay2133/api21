import { maskSensitiveData } from '../src/common/middleware/logging.middleware.js';
import { config } from '../src/config/env.js';

describe('Logger Masking Middleware', () => {
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

      const input = 'Connecting to postgres://admin:dbsecretpassword@localhost:5432/api21';
      const output = maskSensitiveData(input);

      expect(output).not.toContain('dbsecretpassword');
      expect(output).toContain('postgres://admin:***@localhost:5432/api21');
    });
  });
});
