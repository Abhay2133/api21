import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { DatabaseModule } from './core/database/database.module.js';
import { RedisModule } from './core/redis/redis.module.js';
import { BullMQModule } from './core/bullmq/bullmq.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { SessionsModule } from './modules/sessions/sessions.module.js';
import { JobsModule } from './modules/jobs/jobs.module.js';
import { WebhooksModule } from './modules/webhooks/webhooks.module.js';
import { SslMiddleware } from './common/middleware/ssl.middleware.js';
import { RateLimitGuard } from './common/guards/rate-limit.guard.js';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    BullMQModule,
    HealthModule,
    UsersModule,
    SessionsModule,
    JobsModule,
    WebhooksModule,
  ],
  providers: [RateLimitGuard],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SslMiddleware).forRoutes('{*path}');
  }
}
