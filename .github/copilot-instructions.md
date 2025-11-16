# Copilot Instructions for api21

## Architecture Overview

This is a **Buffalo 1.1.3** JSON API (not HTML) with PostgreSQL, using Pop/Soda for database operations. Key architectural decisions:

- **JSON-only responses**: `actions/app.go` sets `contenttype.Set("application/json")` middleware globally; use `c.Render(status, r.JSON(...))` in all handlers
- **Null sessions**: Configured with `sessions.Null{}` - this API doesn't use cookie sessions; implement token-based auth instead
- **Transaction middleware**: Every request wraps in a DB transaction via `popmw.Transaction(models.DB)`; access via `c.Value("tx").(*pop.Connection)`
- **CORS enabled**: Uses `cors.Default()` pre-ware for cross-origin requests
- **Models singleton**: `models.DB` is a global `*pop.Connection` initialized in `models/models.go` init()

## Project Structure

```
actions/          # HTTP handlers and routing (MVC controllers)
  app.go          # Buffalo app setup, middleware stack
  routes.go       # Route definitions (setupRoutes function)
  auth.go         # Authentication handlers
  *_test.go       # Action tests using ActionSuite
cmd/app/main.go   # Entry point, calls actions.App().Serve()
models/           # Pop models and DB connection
migrations/       # Fizz/SQL migrations (currently empty)
grifts/           # Task runner scripts (db:seed, etc.)
fixtures/         # Test fixtures in TOML format (sample.toml example)
locales/          # i18n translations (en-US)
config/           # Buffalo config files
```

## Development Workflows

### Local Development
```bash
# Start dev database (port 5432)
docker compose up -d db

# Run with hot reload (watches .go files, rebuilds to tmp/api21-build)
buffalo dev  # or: bf dev

# Access at http://127.0.0.1:3000
```

### Testing
```bash
# Start test database (port 5433) 
docker compose up -d db-test

# Run all tests
buffalo test

# Tests use fixtures from fixtures/ directory
# ActionSuite setup in actions/actions_test.go loads fixtures via suite.NewActionWithFixtures
```

**Database URLs**:
- Dev: `postgres://api21:api21_password@127.0.0.1:5432/api21_dev`
- Test: `postgres://api21:api21_password@127.0.0.1:5433/api21_test` (port 5433!)
- Test suite reads `TEST_DATABASE_URL` env var (see `database.yml`)

### Database Operations
```bash
# Create databases
buffalo pop create -a

# Run migrations
buffalo pop migrate

# Rollback migration
buffalo pop migrate down

# Seed database
buffalo task db:seed  # runs grifts/db.go seed task
```

## Testing Conventions

- **ActionSuite pattern**: All action tests extend `ActionSuite` which embeds `*suite.Action`
- **Fixture loading**: `suite.NewActionWithFixtures(App(), os.DirFS("../fixtures"))` loads TOML fixtures
- **HTTP test helpers**: Use `as.JSON("/path").Get()`, `as.JSON("/path").Post(data)`, etc.
- **Assertions**: ActionSuite has `as.Equal()`, `as.Contains()`, etc. from testify

**Example test structure** (see `actions/auth_test.go`):
```go
func (as *ActionSuite) Test_LoginHandler() {
    res := as.JSON("/auth/login").Post(map[string]string{"user": "test"})
    as.Equal(http.StatusOK, res.Code)
}
```

## Code Conventions

### Handler Pattern
```go
func HandlerName(c buffalo.Context) error {
    // Access transaction
    tx := c.Value("tx").(*pop.Connection)
    
    // Always return JSON
    return c.Render(http.StatusOK, r.JSON(data))
}
```

### Route Registration
Add routes in `actions/routes.go` `setupRoutes()` function:
```go
app.GET("/path", HandlerName)
app.POST("/path", HandlerName)
```

### Models & Pop
- Use Pop's query builder: `tx.Where("id = ?", id).First(&model)`
- Models package uses global `models.DB` connection
- Pop Debug mode enabled in development (`pop.Debug = true`)

## Build & Deploy

```bash
# Build binary
buffalo build  # outputs to bin/api21

# Build for production
GO_ENV=production buffalo build
```

Binary build target: `./cmd/app` (see `.buffalo.dev.yml`)

## Environment Configuration

- `GO_ENV`: environment selector (development/test/production)
- `TEST_DATABASE_URL`: override test database connection
- `DATABASE_URL`: production database connection
- SSL redirect only enabled when `ENV == "production"`

## Common Patterns

- **Force SSL**: Handled via `forceSSL()` middleware in `actions/app.go` (production only)
- **Parameter logging**: `paramlogger.ParameterLogger` logs request params (filters apply)
- **Migrations**: Currently empty; create with `buffalo pop generate fizz CreateTableName`
- **Grifts**: Task runner for db:seed and custom tasks in `grifts/` directory
