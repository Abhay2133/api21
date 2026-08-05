# Workspace Agent Rules and Context: api21

Welcome! This workspace configuration defines the context, conventions, and guidelines for AI agents working on the `api21` codebase.

---

## 1. Project Overview & Architecture

`api21` is a standalone API server written in Express & TypeScript.
- **Backend**: An Express.js REST API written in TypeScript.
- **Relational DB**: PostgreSQL database, managed via PostgreSQL `pg` client pool with auto-migration.
- **Cache & Rate Limiter**: Redis-backed sliding window rate limiter (200 requests per 15 minutes per IP) applied globally to all `/api/v1/` routes.
- **Docs**: A static, dark-themed glassmorphic interactive API documentation page served at root `/`.

---

## 2. Directory Layout & Key Files

- [src/server.ts](file:///home/abhay/pj/api21/src/server.ts): Application entrypoint.
- [src/app.ts](file:///home/abhay/pj/api21/src/app.ts): Express application bootstrap.
- [src/config/env.ts](file:///home/abhay/pj/api21/src/config/env.ts): Settings loading from environment variables.
- [src/infrastructure/database.ts](file:///home/abhay/pj/api21/src/infrastructure/database.ts): PostgreSQL pool & table migrations.
- [src/infrastructure/redis.ts](file:///home/abhay/pj/api21/src/infrastructure/redis.ts): Redis client connection.
- [src/middleware/](file:///home/abhay/pj/api21/src/middleware): Middleware filters (CORS, Logger, SSL, RateLimit, AdminAuth, ErrorHandler).
- [src/controllers/](file:///home/abhay/pj/api21/src/controllers): Controller handlers for endpoints.
- [static/index.html](file:///home/abhay/pj/api21/static/index.html): Interactive API reference page.

---

## 3. Development Workflow & Commands

```bash
# Install dependencies
npm install

# Run dev server with tsx watch
npm run dev

# Build production bundle
npm run build

# Run unit tests
npm test
```
