# AI Coding Agent Instructions for API21

## Project Overview
API21 is a Go REST API built with Fiber framework following MVC architecture. It features database migrations with golang-migrate, background cron jobs, graceful shutdown, and environment-configurable health monitoring.

## Architecture & Key Patterns

### MVC Structure
- **Models** (`src/models/`): GORM-based data structures with database methods (see `user.go`)
- **Controllers** (`src/controllers/`): HTTP handlers returning JSON with consistent response format
- **Routes** (`src/routes/`): Fiber route definitions with grouped endpoints
- **Migrations** (`migrations/`): Database schema management using golang-migrate

### Database Architecture
- **Development**: SQLite database (`tmp/api21.db`)
- **Production**: PostgreSQL (via `DATABASE_URL` environment variable)
- **Migrations**: Managed by golang-migrate with automatic startup execution
- **ORM**: GORM for database operations and model management

### Migration System
- **Location**: `migrations/` directory with sequential numbered files
- **Format**: `{version}_{name}.{up|down}.sql` (e.g., `000001_create_users_table.up.sql`)
- **Management**: Use `make migration-create name=<name>` to create new migrations
- **Execution**: Automatic on application startup via `src/migrations/manager.go`
- **Commands**: Full CLI support via Makefile (up, down, version, reset, etc.)

### Response Format Convention
All API responses follow this structure:
```go
fiber.Map{
    "success": true/false,
    "message": "Descriptive message",
    "data":    actualData,      // For successful responses
    "error":   errorDetails,    // For error responses
    "count":   len(data),       // For collection responses
}
```

### Cron Jobs Architecture
- `src/cron_jobs.go` manages background tasks with graceful shutdown
- Memory monitoring runs every minute using `runtime.MemStats`
- URL ping jobs are environment-configurable (`PING_URL`, `PING_INTERVAL`)
- All cron logs use `[CRON]` prefix for easy filtering

## Development Workflow

### Building & Running
```bash
make run                    # Development mode
make run-with-ping         # With example ping job enabled
make build                 # Build binary to bin/api21
make dev                   # Auto-reload with air
```

### Migration Commands
```bash
make migration-create name=<name>   # Create new migration
make migrate-up                     # Apply pending migrations
make migrate-down                   # Rollback last migration
make migrate-version                # Check migration status
make migrate-install                # Install golang-migrate CLI
```

**Important**: Migration commands automatically detect the database URL in this order:
1. `DATABASE_URL` from `.env` file (if exists)
2. `DATABASE_URL` environment variable
3. Fallback to `sqlite3://tmp/api21.db` for development

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string for production (auto-switches from SQLite)
- `PING_URL`: Target URL for health check pings
- `PING_INTERVAL`: Ping interval in minutes (positive integer)

### Project Conventions
- **Logging**: Use consistent prefixes `[MAIN]`, `[CRON]`, `[MIGRATION]` for different components
- **Port**: Application runs on `:3000` by default
- **Graceful Shutdown**: 10-second timeout for cleanup
- **Error Handling**: Always return appropriate HTTP status codes with error details

## Critical Integration Points

### Application Lifecycle
1. `main.go` initializes database connection and runs migrations
2. `main.go` initializes cron jobs before starting Fiber server
3. Signal handling (`SIGTERM`, `SIGINT`) triggers graceful shutdown
4. Cron scheduler stops before HTTP server shutdown
5. Database connections are properly closed during shutdown

### Middleware Stack (order matters)
1. Logger middleware (logs all requests)
2. Recover middleware (panic recovery)
3. CORS middleware (allows all origins)
4. Static file middleware (serves from `./public` directory)

### Static File Serving
- Files in `public/` directory are served at root path (`/`)
- Example: `public/css/style.css` accessible at `http://localhost:3000/css/style.css`
- Static middleware configured before API routes to avoid conflicts

### Route Grouping Pattern
```go
api := app.Group("/api")
userRoutes := api.Group("/users")
// Results in /api/users/* endpoints
```

## Testing & Debugging
- Database operations use GORM with SQLite for development
- Health check endpoint: `GET /api/health`
- Memory monitoring logs help debug performance issues
- Migration status can be checked with `make migrate-version`
- Use `make test` for running tests

### Database Connection Debugging
If you encounter "sql: database is closed" errors in API endpoints:

1. **Test Database Standalone**: Create a test script to verify database operations work in isolation
2. **Test Simplified Server**: Run server without migrations/cron jobs to isolate the issue
3. **Check Migration Manager**: Ensure `RunMigrations()` doesn't close the database connection
4. **Use Debug Endpoints**: Create temporary debug endpoints with detailed error logging

**Example Debug Commands**:
```bash
# Test database operations directly
go run tests/db_test_standalone.go

# Test simplified server (skip migrations/cron)
go run test_main.go  # Custom test server on different port
```

## Common Pitfalls
- Cron jobs skip silently if environment variables are invalid
- Controllers must handle ID parameter conversion errors
- Background processes need proper cleanup in shutdown sequence
- Migration files should never be modified after being applied in production
- Always test migrations in development before production deployment
- **Migration Manager**: The `RunMigrations()` function intentionally doesn't call `manager.Close()` to avoid closing the underlying database connection that GORM uses
- **Database URL Priority**: Makefile migration commands read from `.env` file first, then environment variables, then fallback to SQLite