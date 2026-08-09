import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || process.env.GO_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/api21?sslmode=disable',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',
  masterCredentials: process.env.MASTER_CREDENTIALS || 'admin:securepassword',
  deployCiToken: process.env.DEPLOY_CI_TOKEN || 'secret-ci-token',
  redeployScript: process.env.REDEPLOY_SCRIPT || 'node start.js ${deployment_id}',
  isProduction: (process.env.NODE_ENV || process.env.GO_ENV) === 'production',
  isTest: (process.env.NODE_ENV || process.env.GO_ENV) === 'test',
};
