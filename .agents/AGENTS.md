# Workspace Agent Rules and Context: api21

Welcome! This workspace configuration defines the context, conventions, and guidelines for AI agents working on the `api21` codebase.

---

## 1. Project Overview & Architecture

`api21` is a standalone API server written in Go. The frontend has been moved to a separate repository.
- **Backend**: A Go (v1.22+) REST API built using the **Gin** web framework.
- **Relational DB & ORM**: PostgreSQL database, managed via **GORM** ORM. Connections and auto-migrations are configured on application startup.
- **Cache & Rate Limiter**: Redis-backed sliding window rate limiter (200 requests per 15 minutes per IP) applied globally to all `/api/` routes.
- **Docs**: A static, beautiful dark-themed glassmorphic interactive API documentation page served at the root `/`.

---

## 2. Directory Layout & Key Files

- [cmd/app/main.go](file:///home/abhay/projects/PP/api21/cmd/app/main.go): Application entrypoint. Responsible for configuration parsing, database initialization, Redis configuration, registering router middlewares and endpoints, and booting the HTTP server.
- [config/config.go](file:///home/abhay/projects/PP/api21/config/config.go): Configures settings loading from environment variables or `.env` files.
- [db/db.go](file:///home/abhay/projects/PP/api21/db/db.go): Manages GORM database connections and auto-migrations.
- [redis/redis.go](file:///home/abhay/projects/PP/api21/redis/redis.go): Initializes the Redis client connection and exports health verification methods.
- [middleware/](file:///home/abhay/projects/PP/api21/middleware): Request filter layer including:
  - [cors.go](file:///home/abhay/projects/PP/api21/middleware/cors.go): Handles CORS configurations for the external frontend repo.
  - [logger.go](file:///home/abhay/projects/PP/api21/middleware/logger.go): Standardized HTTP logging.
  - [ratelimit.go](file:///home/abhay/projects/PP/api21/middleware/ratelimit.go): Redis-backed rate limiting logic.
  - [ssl.go](file:///home/abhay/projects/PP/api21/middleware/ssl.go): Production SSL redirects.
- [handlers/](file:///home/abhay/projects/PP/api21/handlers): HTTP route action controllers.
  - [health.go](file:///home/abhay/projects/PP/api21/handlers/health.go): Endpoint verifying database and Redis connectivity states.
  - [user.go](file:///home/abhay/projects/PP/api21/handlers/user.go): CRUD endpoints to manage users.
- [services/ping.go](file:///home/abhay/projects/PP/api21/services/ping.go): Self-ping worker keeping the instance active in cloud environments.
- [static/index.html](file:///home/abhay/projects/PP/api21/static/index.html): Interactive API reference page.

---

## 3. Environment & Configuration

The application reads configurations from environment variables or a local `.env` file:
- `GO_ENV`: The runtime environment (`development`, `production`, `test`).
- `PORT`: Gin backend server port (defaults to `3000`).
- `DATABASE_URL`: Connection string for PostgreSQL (defaults to `postgres://postgres:postgres@127.0.0.1:5432/api21?sslmode=disable`).
- `REDIS_URL`: Address for Redis rate limiting/caching (defaults to `redis://localhost:6379/0`).

---

## 4. Development Workflow & Commands

Commands are run using standard Go tooling:

```bash
# Run local Go dev server
export PATH=$PATH:/home/abhay/.local/go/bin
go run cmd/app/main.go

# Compile production binary
go build -o bin/server ./cmd/app

# Run all unit tests
go test ./...
```

---

## 5. Agent Instructions & Rules

1. **Keep Comments / Docstrings**: Retain existing docstrings, Go comments, and package documentation unless explicitly instructed by the user.
2. **API Endpoint Route Grouping**: All JSON REST endpoints must begin with `/api/v1/`. The root `/` serves static HTML API documentation.
3. **Database Migrations**: When changing database models, update the struct definitions in the [models/](file:///home/abhay/projects/PP/api21/models) package, and ensure they are added to `AutoMigrate` in [db/db.go](file:///home/abhay/projects/PP/api21/db/db.go).
4. **Code Quality and SOLID Guidelines**: Enforce standard Go conventions:
   - Handle all return errors explicitly: do not discard them using `_` unless absolutely safe and documented.
   - Use meaningful variable names, keep functions concise, and write accompanying tests under the corresponding packages (e.g. `handlers/health_test.go`).
