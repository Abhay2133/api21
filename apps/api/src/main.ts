import 'reflect-metadata';
import { createNestApp } from './app.factory.js';
import { config } from './config/env.js';

export async function bootstrap() {
  try {
    const app = await createNestApp();
    app.enableShutdownHooks();

    await app.listen(config.port, () => {
      console.log(`[Server] NestJS server running at http://localhost:${config.port} in ${config.env} mode`);
    });

    return app;
  } catch (err) {
    console.error('[Server] Fatal error starting server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}
