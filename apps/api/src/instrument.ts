import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as Sentry from '@sentry/node';

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

const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
  });
}

export { Sentry };
