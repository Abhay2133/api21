import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

function findEnvFile(): string {
  let curr = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(curr, '.env');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return path.resolve(process.cwd(), '.env');
}

dotenv.config({ path: findEnvFile() });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  env: process.env.NODE_ENV || process.env.GO_ENV || 'development',
  nodeEnv: process.env.NODE_ENV || process.env.GO_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/api21?sslmode=disable',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',
  masterCredentials: process.env.MASTER_CREDENTIALS || 'admin:securepassword',
  deployCiToken: process.env.DEPLOY_CI_TOKEN || 'secret-ci-token',
  redeployScript: process.env.REDEPLOY_SCRIPT || 'node start.js ${deployment_id}',
  sentryDsn: process.env.SENTRY_DSN || '',
  isProduction: (process.env.NODE_ENV || process.env.GO_ENV) === 'production',
  isTest: (process.env.NODE_ENV || process.env.GO_ENV) === 'test',
};
