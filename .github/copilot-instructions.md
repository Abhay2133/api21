# GitHub Copilot Instructions for API21

## Architecture Overview

This is a Go Fiber REST API with clean architecture patterns. Key components:

- **Entry Point**: `cmd/server/main.go` - Sets up Fiber app, middleware, cron jobs, and graceful shutdown
- **Internal Package Structure**: Config → Routes → Handlers → Models, with middleware and utilities supporting all layers
- **Cron Jobs**: `internal/cron_jobs/` - Automatic URL ping service with configurable scheduling
- **Test Structure**: All tests consolidated in `./tests/` directory using external black-box testing

## Critical Development Workflows

### Primary Development Commands
```bash
make dev              # Hot reload with Air (preferred for development)
go run cmd/server/main.go  # Direct execution
```

### Testing Strategy
- **Location**: All tests in `./tests/` directory (not package-level `_test.go` files)
- **Pattern**: External testing using `package tests` and importing `api21/internal/*`
- **Run Tests**: `go test ./tests/...` or `make test`
- **Integration Tests**: Full HTTP server testing with actual Fiber app instances

### Build and Deploy
```bash
make build            # Single platform build
make build-all        # Multi-platform builds (Linux/Windows/macOS)
```

## Project-Specific Patterns

### Configuration Management
- **Pattern**: Centralized config in `internal/config/config.go` with struct-based env loading
- **Example**: `cfg := config.Load()` loads all environment variables with defaults
- **Cron Jobs Config**: `CronJobsConfig` embedded in main config struct

### Error Handling
- **Pattern**: Fiber's built-in error handler with custom JSON responses
- **Location**: Error handler defined in `cmd/server/main.go` Fiber config
- **Format**: Returns `{"error": "message"}` with appropriate HTTP status codes

### Route Organization
- **Pattern**: Route groups in `internal/routes/routes.go` with handler delegation
- **Structure**: `/api/v1` prefix → resource groups (`/users`, `/items`) → HTTP methods
- **Handler Location**: All handlers in `internal/handlers/handlers.go`

### Cron Jobs Integration
- **Manager Pattern**: `cron_jobs.NewManager()` centralizes all scheduled tasks
- **Environment Driven**: Jobs start only if `PING_URL` is set
- **Graceful Shutdown**: Cron manager stops automatically on app termination
- **Monitoring**: `/cron/status` endpoint shows job status and next run times

## Key Integration Points

### Database (GORM)
- **ORM**: GORM with PostgreSQL, but database layer is in `internal/database/`
- **Models**: Defined in `internal/models/models.go`
- **Connection**: Auto-migration on startup (when database is configured)

### Middleware Stack
- **Order**: Logger → Recovery → CORS → Custom middleware
- **Custom**: Request ID, rate limiting, API key validation in `internal/middleware/`
- **Configuration**: CORS allows all origins with standard headers

### Environment Variables
- **Required**: None (all have defaults)
- **Cron Jobs**: `PING_URL` (required for ping job), `PING_SCHEDULE` (optional, defaults to "*/5 * * * *")
- **Database**: Standard `DB_*` prefixed variables
- **Loading**: Uses `joho/godotenv` with graceful fallback if no `.env` file

## Development Environment

### Hot Reload Setup
- **Tool**: Air (github.com/air-verse/air)
- **Config**: Air config in project root enables automatic rebuilds
- **Command**: `make dev`

## Testing Conventions

### Test File Naming
- **Pattern**: `{component}_test.go` in `./tests/` directory
- **Package**: Always `package tests` with imports to `api21/internal/*`
- **Example**: `tests/cron_jobs_test.go` tests `internal/cron_jobs` package

### HTTP Testing Pattern
```go
app := fiber.New()
routes.SetupRoutes(app)
req := httptest.NewRequest("GET", "/api/v1/users", nil)
resp, _ := app.Test(req)
```

### Environment Variable Testing
```go
os.Setenv("KEY", "value")
defer os.Unsetenv("KEY")
```
