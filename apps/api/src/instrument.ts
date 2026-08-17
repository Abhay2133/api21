import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import * as Sentry from '@sentry/node';

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

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
  console.log('[Sentry] Initialized successfully for environment:', process.env.NODE_ENV || 'development');
} else {
  console.warn('[Sentry] SENTRY_DSN is missing from .env! Sentry tracking is disabled on this machine.');
}

export { Sentry };
