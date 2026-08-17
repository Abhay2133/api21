import * as Sentry from '@sentry/node';

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
