import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { RateLimitGuard } from './common/guards/rate-limit.guard.js';
import { setupBullBoard } from './modules/admin/bull-board.setup.js';

export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Global Prefix for REST routes
  app.setGlobalPrefix('api/v1', {
    exclude: ['admin/queues', 'admin/queues/{*path}'],
  });

  // Global Interceptors, Filters, Guards, Pipes
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: false,
    })
  );

  const rateLimitGuard = app.get(RateLimitGuard);
  app.useGlobalGuards(rateLimitGuard);

  // Static HTML documentation served at root /
  const expressApp = app.getHttpAdapter().getInstance();
  const staticPathInDist = path.resolve(process.cwd(), 'dist', 'static');
  const staticPathInRoot = path.resolve(process.cwd(), 'static');
  const staticPath = fs.existsSync(staticPathInDist) ? staticPathInDist : staticPathInRoot;

  expressApp.use(express.static(staticPath));
  expressApp.get('/', (req: any, res: any) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  // Bull Board Admin UI Dashboard
  setupBullBoard(app);

  return app;
}
