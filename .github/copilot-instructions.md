# Copilot Instructions for API21

This document provides guidelines for GitHub Copilot when working on the **API21** project - a Buffalo-based REST API built with Go.

## Project Overview

- **Type**: Go REST API using Buffalo web framework
- **Database**: PostgreSQL (primary) with SQLite support
- **ORM**: Pop (built-in Buffalo ORM)
- **Key Features**: MVC architecture, database migrations, CORS support, Docker ready, hot-reload development
- **Go Version**: 1.24.5+

## Project Structure & Key Files

```
api21/
├── actions/              # HTTP handlers (controllers)
│   ├── app.go          # Main app config & middleware setup
│   ├── home.go         # Health check endpoint
│   └── render.go       # Response rendering utilities
│
├── models/             # Data models (ORM entities)
│   ├── models.go       # DB connection & connection pool setup
│   ├── user.go         # User model with validation
│   └── *_test.go       # Model tests
│
├── migrations/         # Database schema migrations (Fizz DSL)
│   ├── *.up.fizz       # Create/alter schema scripts
│   └── *.down.fizz     # Rollback scripts
│
├── cmd/app/main.go     # Application entry point
├── config/             # Configuration files (TOML format)
├── grifts/             # Task runners (like Rake tasks)
├── locales/            # i18n translations (YAML format)
└── database.yml        # Database configuration for different environments
```

## Code Style & Conventions

### Go Code Standards
- Follow Go idioms and best practices
- Use meaningful variable names (avoid single letters except in loops)
- Always handle errors explicitly; never ignore returned errors
- Keep functions small and focused (max ~50 lines)
- Use the `err` pattern for error returns: `if err != nil { return err }`

### File Naming
- Model files: `<resource>.go` (e.g., `user.go`, `post.go`)
- Test files: `<resource>_test.go` (e.g., `user_test.go`)
- Action files: `<resource>.go` in actions folder
- Migration files: `TIMESTAMP_<description>.<up|down>.fizz`

### Models
- Always include UUID as primary key: `ID uuid.UUID`
- Always include timestamps: `CreatedAt` and `UpdatedAt`
- Implement `Validate()` method for model validation
- Use json tags for JSON serialization: `` `json:"field_name"` ``
- Use db tags for database mapping: `` `db:"column_name"` ``

### Actions (Controllers)
- Handle HTTP requests and return buffalo.Context responses
- Use middleware from `actions/app.go` for transaction wrapping
- Always use `c.Value("tx").(*pop.Connection)` to access database
- Return appropriate HTTP status codes (200, 201, 204, 400, 404, 422, 500)

### Middleware & CORS
- CORS is pre-configured in `actions/app.go` with `cors.Default()`
- Content-Type is set to "application/json" automatically
- Requests are wrapped in database transactions automatically
- SSL redirection is enabled in production mode

## Database Management

### Adding a New Model/Table
1. Use buffalo generate: `buffalo pop generate model <name> field:type ...`
2. Review generated migration in `migrations/`
3. Run: `buffalo pop migrate up`
4. Create model tests in `models/<name>_test.go`

### Migrations
- Use Fizz DSL for migrations (PostgreSQL-compatible)
- Always create matching `.up.fizz` and `.down.fizz` files
- Make migrations idempotent when possible
- Test rollbacks: `buffalo pop migrate down` then `up` again
- Examples:
  ```fizz
  # Create table
  create_table("users") {
    t.Column("id", "uuid", {primary: true})
    t.Column("name", "string", {})
    t.Timestamps()
  }
  
  # Add column
  add_column("users", "phone", "string", {nullable: true})
  
  # Add index
  add_index("users", ["email"], {unique: true})
  ```

### Running Migrations
- Development: `buffalo pop migrate up`
- Production: Handled by `make start` command
- Check status: `buffalo pop migrate status`

## API Endpoints & Routing

### Current Endpoints
- `GET /` - Health check (returns welcome message)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/{id}` - Get specific user by UUID
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Adding New Endpoints
1. Create action in `actions/<resource>.go`
2. Add route in `actions/app.go`: `app.Resource("<resource>", <Resource>{})`
3. Implement handlers: `List`, `Show`, `Create`, `Update`, `Destroy`
4. Use proper HTTP status codes

### Request/Response Format
- All APIs use JSON format (Content-Type: application/json)
- Request body validation happens in model's `Validate()` method
- Return validation errors with 422 status
- Return 404 for not found
- Return 500 for server errors with error message

## Testing

### Running Tests
- All tests: `buffalo test` or `make test`
- Specific package: `buffalo test ./models`
- With coverage: `buffalo test -cover`
- Verbose: `buffalo test -v`

### Test Conventions
- Model tests: `models/*_test.go`
- Integration tests: `actions/*_test.go`
- Use testify for assertions: `require.NoError()`, `require.Equal()`, etc.
- Set up test database using models_test.go helpers
- Test both success and error cases

### Example Test Structure
```go
func TestUserValidation(t *testing.T) {
    u := &models.User{
        Name:         "John Doe",
        Email:        "john@example.com",
        PasswordHash: "hashed",
    }
    verrs, _ := u.Validate(nil)
    require.NoError(t, verrs.Error())
}
```

## Development Workflow

### Local Setup
1. Install: `go mod download && go mod tidy`
2. Create DB: `buffalo pop create -a`
3. Migrate: `buffalo pop migrate up`
4. Run dev: `buffalo dev` (hot-reload enabled)
5. Server runs on `http://localhost:5000`

### Build & Production
- Build: `make build` or `buffalo build`
- Start prod: `make start` (installs, migrates, builds, runs)
- Binary location: `bin/api21`
- Production uses env vars (GO_ENV=production)

### Common Commands
```bash
# Development
buffalo dev                           # Run with hot-reload
buffalo build                         # Build binary
buffalo test                          # Run tests
buffalo routes                        # Show all routes

# Database
buffalo pop create -a                 # Create databases
buffalo pop migrate up                # Apply migrations
buffalo pop migrate down              # Rollback
buffalo pop migrate status            # Check status
buffalo pop generate migration <name> # Create migration

# Generation
buffalo generate model <name>         # Create model + migration
buffalo generate action <name>        # Create action handler
buffalo pop generate model <name>     # Pop model + migration
```

## Key Dependencies

### Framework & Core
- `github.com/gobuffalo/buffalo` - Web framework
- `github.com/gobuffalo/buffalo-pop/v3` - Buffalo + Pop integration
- `github.com/gobuffalo/pop/v6` - ORM

### Database & Validation
- `github.com/gobuffalo/validate/v3` - Validation framework
- `github.com/gofrs/uuid` - UUID generation

### Middleware & Utilities
- `github.com/gobuffalo/middleware` - Built-in middleware
- `github.com/gobuffalo/envy` - Environment variable handling
- `github.com/rs/cors` - CORS support
- `github.com/unrolled/secure` - Security middleware

### Testing
- `github.com/gobuffalo/suite/v4` - Test suite
- `github.com/stretchr/testify` - Testing assertions

## Environment Variables

### Development (.env)
```bash
PORT=5000
GO_ENV=development
DATABASE_URL=postgres://api21:api21_password@localhost:5432/api21_dev
```

### Production
```bash
GO_ENV=production
PORT=5000 (or 8080, etc.)
DATABASE_URL=postgres://user:pass@prod-db:5432/api21_prod
```

## Common Patterns

### Database Transaction Access
```go
func SomeHandler(c buffalo.Context) error {
    tx := c.Value("tx").(*pop.Connection)
    var user models.User
    err := tx.Find(&user, userID)
    // ...
}
```

### Model Validation
```go
func (u *User) Validate(tx *pop.Connection) (*validate.Errors, error) {
    return validate.Validate(
        &validators.StringIsPresent{Field: u.Name, Name: "Name"},
        &validators.EmailIsPresent{Field: u.Email, Name: "Email"},
    ), nil
}
```

### JSON Response
```go
return c.Render(200, r.JSON(user))          // Single resource
return c.Render(200, r.JSON(users))         // List of resources
return c.Render(422, r.JSON(verrs.Error())) // Validation errors
```

### Creating/Updating Models
```go
tx := c.Value("tx").(*pop.Connection)
user := &models.User{Name: "John", Email: "john@example.com"}
verrs, err := tx.ValidateAndCreate(user)    // Create with validation
```

## Important Notes

- **Always test migrations** - They should be idempotent and reversible
- **UUID for IDs** - Use `gofrs/uuid` for all primary keys
- **Transactions enabled** - All requests are wrapped in DB transactions
- **CORS enabled** - No CORS configuration needed for local testing
- **Hot-reload in dev** - Use `buffalo dev` for automatic rebuilds
- **Docker support** - Dockerfile and docker-compose.yml included
- **Environment-aware** - Use `GO_ENV` to switch between dev/test/prod
- **No hardcoded DB creds** - Use environment variables and database.yml

## Resources

- [Buffalo Docs](https://gobuffalo.io/en/docs)
- [Pop ORM Docs](https://gobuffalo.io/en/docs/db/getting-started)
- [Fizz DSL Reference](https://gobuffalo.io/en/docs/db/fizz)
- [Go Documentation](https://golang.org/doc/)

## When Adding Features

When implementing new features, ensure:
1. ✅ Create model with validation rules
2. ✅ Create database migration (up/down)
3. ✅ Create action handlers (CRUD operations)
4. ✅ Add routes to `actions/app.go`
5. ✅ Write unit tests for models
6. ✅ Write integration tests for actions
7. ✅ Test migrations up and down
8. ✅ Update this document if patterns change
9. ✅ Run `buffalo test` before committing
10. ✅ Follow Go conventions and code style
