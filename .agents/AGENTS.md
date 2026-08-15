# Workspace Agent Rules and Context: api21

Welcome! This workspace configuration defines the context, conventions, and guidelines for AI agents working on the `api21` monorepo codebase.

---

## 1. Project Overview & Monorepo Architecture

`api21` is a modular pnpm/npm monorepo consisting of:
- **`apps/api` (`@api21/api`)**: Nest.js modular REST API server with PostgreSQL (Knex pool), Redis sliding-window rate limiter, BullMQ background jobs, and static interactive API documentation.
- **`apps/chat` (`@api21/chat`)**: Chat application skeleton consuming backend services and shared types.
- **`apps/admin` (`@api21/admin`)**: Admin dashboard application skeleton for monitoring health and queues.
- **`packages/types` (`@api21/types`)**: Central shared package exporting DTOs (with `class-validator`), entity interfaces, and API response schemas used across all apps.

---

## 2. Directory Layout & Key Files

### Root Configuration
- [pnpm-workspace.yaml](file:///home/abhay/pj/api21/pnpm-workspace.yaml): Workspace definitions (`apps/*`, `packages/*`).
- [package.json](file:///home/abhay/pj/api21/package.json): Root monorepo orchestrator.
- [docker-compose.yml](file:///home/abhay/pj/api21/docker-compose.yml): Local PostgreSQL & Redis infrastructure.
- [start.js](file:///home/abhay/pj/api21/start.js): Zero-downtime deployment runner.
- [ecosystem.config.cjs](file:///home/abhay/pj/api21/ecosystem.config.cjs): PM2 cluster & worker multi-process config.

### API Application (`apps/api/`)
- [apps/api/src/main.ts](file:///home/abhay/pj/api21/apps/api/src/main.ts): NestJS application bootstrap entry point.
- [apps/api/src/app.module.ts](file:///home/abhay/pj/api21/apps/api/src/app.module.ts): Root application module.
- [apps/api/src/app.factory.ts](file:///home/abhay/pj/api21/apps/api/src/app.factory.ts): Application factory.
- [apps/api/src/worker.ts](file:///home/abhay/pj/api21/apps/api/src/worker.ts): Standalone BullMQ worker process.
- [apps/api/src/core/](file:///home/abhay/pj/api21/apps/api/src/core): `DatabaseModule`, `RedisModule`, `BullMQModule`.
- [apps/api/src/common/](file:///home/abhay/pj/api21/apps/api/src/common): `AdminAuthGuard`, `RateLimitGuard`, `AllExceptionsFilter`, `LoggingInterceptor`, `SslMiddleware`.
- [apps/api/src/modules/](file:///home/abhay/pj/api21/apps/api/src/modules): `UsersModule`, `SessionsModule`, `JobsModule`, `WebhooksModule`, `HealthModule`.
- [apps/api/static/index.html](file:///home/abhay/pj/api21/apps/api/static/index.html): Interactive documentation page.

### Shared Types (`packages/types/`)
- [packages/types/src/index.ts](file:///home/abhay/pj/api21/packages/types/src/index.ts): Central export for all DTOs and interfaces (`CreateUserDto`, `CreateSessionDto`, `EnqueueJobDto`, `User`, `Session`, `HealthResponse`, etc.).

---

## 3. Development Workflow & Commands

```bash
# Install dependencies across all workspace packages
pnpm install

# Start local PostgreSQL and Redis containers
pnpm docker:up

# Run API dev server
pnpm dev
# or: pnpm --filter @api21/api dev

# Run BullMQ worker
pnpm dev:worker

# Run Chat or Admin skeletons
pnpm dev:chat
pnpm dev:admin

# Build all workspace packages
pnpm build

# Run all test suites
pnpm test

# Run API database migrations
pnpm migrate:latest

# Stop containers
pnpm docker:down
```
