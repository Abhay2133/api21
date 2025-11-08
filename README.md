# API21 - Buffalo REST API Server

A modern, production-ready REST API built with [Buffalo](https://gobuffalo.io/) and [Go](https://golang.org/). This project provides a scalable foundation for building REST APIs with built-in database migrations, ORM support, and best practices.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Development Guide](#development-guide)
- [Database Migrations](#database-migrations)
- [API Examples](#api-examples)
- [Creating New Resources](#creating-new-resources)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

## 🎯 Project Overview

**API21** is a Buffalo-based REST API that includes:

- ✅ **MVC Architecture** - Clean separation of concerns
- ✅ **PostgreSQL/SQLite Support** - Flexible database configuration
- ✅ **Pop ORM** - Built-in ORM for database operations
- ✅ **Database Migrations** - Version control for database schema
- ✅ **CORS Enabled** - Cross-origin resource sharing pre-configured
- ✅ **JSON API** - Native JSON request/response handling
- ✅ **Docker Ready** - Docker and docker-compose included
- ✅ **Grifts** - Task automation and CLI commands
- ✅ **Hot Reload** - Automatic rebuild during development

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Go** >= 1.19 ([Install Go](https://golang.org/doc/install))
- **PostgreSQL** >= 12 ([Install PostgreSQL](https://www.postgresql.org/download/))
- **Buffalo CLI** ([Install Buffalo](https://gobuffalo.io/en/docs/getting-started/installation))
- **Docker & Docker Compose** (optional, for containerization)

### Verify Installation

```bash
go version
buffalo version
psql --version
docker --version
docker-compose --version
```

## 🚀 Quick Start

### 1. Clone and Setup the Project

```bash
cd /workspaces/api21
```

### 2. Install Dependencies

```bash
go mod download
go mod tidy
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your preferred editor
```

### 4. Start PostgreSQL

Using Docker:
```bash
docker-compose up -d
```

Or start PostgreSQL locally:
```bash
# macOS (if installed via Homebrew)
brew services start postgresql

# Linux (Ubuntu/Debian)
sudo systemctl start postgresql

# Windows (if installed via installer)
# Start via Services or PostgreSQL app
```

### 5. Create and Migrate Database

```bash
# Create development and test databases
buffalo pop create -a

# Run all pending migrations
buffalo pop migrate up
```

### 6. Run the Development Server

```bash
buffalo dev
```

The server will start on `http://localhost:3000` with hot-reload enabled. Any changes you make will automatically rebuild the application.

### 7. Test the API

```bash
# Health check endpoint
curl http://localhost:3000/

# Get all users
curl http://localhost:3000/api/users

# Create a new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","encrypted_password":"hashed_password"}'
```

## 📁 Project Structure

```
api21/
├── actions/                          # HTTP handlers (controllers)
│   ├── app.go                       # Main app configuration & middleware
│   ├── home.go                      # Health check endpoint
│   ├── home_test.go                 # Tests for home handler
│   ├── render.go                    # Response rendering utilities
│   └── actions_test.go              # Base test setup
│
├── models/                          # Data models (ORM entities)
│   ├── models.go                    # Database connection setup
│   ├── models_test.go               # Test database setup
│   ├── user.go                      # User model definition
│   └── user_test.go                 # User model tests
│
├── migrations/                      # Database schema migrations
│   ├── 20251108074426_create_users.up.fizz     # Create users table
│   └── 20251108074426_create_users.down.fizz   # Rollback script
│
├── cmd/
│   └── app/
│       └── main.go                  # Application entry point
│
├── config/
│   ├── buffalo-app.toml            # Buffalo configuration
│   └── buffalo-plugins.toml        # Plugin configuration
│
├── grifts/                          # Task runners (like Rake)
│   ├── db.go                        # Database tasks
│   └── init.go                      # Task initialization
│
├── locales/                         # i18n translations
│   ├── all.en-us.yaml              # English translations
│   └── embed.go                     # Embedded locales
│
├── fixtures/                        # Test data
│   └── sample.toml                  # Sample test fixtures
│
├── database.yml                     # Database configuration
├── docker-compose.yml               # Docker services definition
├── Dockerfile                       # Container image definition
├── go.mod & go.sum                  # Go module dependencies
├── .env.example                     # Example environment variables
├── .env                             # Local environment variables (git ignored)
└── README.md                        # This file
```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Server
PORT=3000
GO_ENV=development

# Database
DATABASE_URL=postgres://api21:api21_password@localhost:5432/api21_dev

# Optional
PING_URL=
PING_INTERVAL=5
```

### Database Configuration (database.yml)

The `database.yml` file defines database connections for different environments:

```yaml
development:
  dialect: postgres
  database: api21_dev
  user: api21
  password: api21_password
  host: 127.0.0.1
  pool: 5

test:
  url: postgres://api21:api21_password@127.0.0.1:5432/api21_test?sslmode=disable

production:
  url: {{envOr "DATABASE_URL" "postgres://api21:api21_password@127.0.0.1:5432/api21_production?sslmode=disable"}}
```

**Note:** In production, use environment variables via `DATABASE_URL` instead of hardcoding credentials.

## 💻 Development Guide

### Running the Development Server

```bash
# Start with hot-reload
buffalo dev

# Start without hot-reload
buffalo build && ./bin/api21

# Run on a custom port
PORT=8080 buffalo dev
```

### Project Architecture

#### Actions (Controllers)

Actions handle HTTP requests and return responses. Located in `actions/`:

```go
// Example: actions/user.go
package actions

import (
    "github.com/gobuffalo/buffalo"
    "api21/models"
)

// ListUsers handles GET /api/users
func ListUsers(c buffalo.Context) error {
    users := models.Users{}
    c.Value("tx").(*pop.Connection).All(&users)
    
    return c.Render(200, r.JSON(users))
}

// CreateUser handles POST /api/users
func CreateUser(c buffalo.Context) error {
    user := &models.User{}
    c.Bind(user)
    
    tx := c.Value("tx").(*pop.Connection)
    if err := tx.ValidateAndCreate(user); err != nil {
        return c.Render(422, r.JSON(err.Error()))
    }
    
    return c.Render(201, r.JSON(user))
}
```

#### Models (ORM Entities)

Models represent database tables. Located in `models/`:

```go
// models/user.go
type User struct {
    ID                uuid.UUID `json:"id" db:"id"`
    Name              string    `json:"name" db:"name"`
    Email             string    `json:"email" db:"email"`
    EncryptedPassword string    `json:"encrypted_password" db:"encrypted_password"`
    CreatedAt         time.Time `json:"created_at" db:"created_at"`
    UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}
```

#### Routes

Routes are defined in `actions/app.go`:

```go
func App() *buffalo.App {
    app := buffalo.New(buffalo.Options{...})
    
    api := app.Group("/api")
    users := api.Group("/users")
    users.GET("/", ListUsers)
    users.POST("/", CreateUser)
    users.GET("/{id}", GetUser)
    users.PUT("/{id}", UpdateUser)
    users.DELETE("/{id}", DeleteUser)
    
    return app
}
```

### Middleware

Buffalo includes several pre-configured middleware in `actions/app.go`:

- **CORS** - Enables cross-origin requests
- **Content-Type** - Sets `application/json` content type
- **Parameter Logger** - Logs request parameters
- **Force SSL** - Redirects HTTP to HTTPS (production only)
- **Transaction** - Wraps each request in a database transaction

## 🗄️ Database Migrations

Migrations manage database schema versioning. They're stored in the `migrations/` directory using Fizz DSL.

### Creating Migrations

```bash
# Create a new migration (generates timestamp automatically)
buffalo pop generate migration add_column_to_users

# Creates:
# migrations/20251108120000_add_column_to_users.up.fizz
# migrations/20251108120000_add_column_to_users.down.fizz
```

### Migration Examples

**Create a table:**
```fizz
create_table("users") {
    t.Column("id", "uuid", {primary: true})
    t.Column("name", "string", {})
    t.Column("email", "string", {unique: true})
    t.Column("encrypted_password", "string", {})
    t.Timestamps()
}
```

**Add a column:**
```fizz
add_column("users", "phone", "string", {nullable: true})
```

**Add an index:**
```fizz
add_index("users", ["email"], {unique: true})
```

**Drop a table:**
```fizz
drop_table("users")
```

### Running Migrations

```bash
# Apply all pending migrations
buffalo pop migrate up

# Rollback the last migration
buffalo pop migrate down

# Migrate to a specific version
buffalo pop migrate to <version>

# Check migration status
buffalo pop migrate status

# Create databases
buffalo pop create -a

# Drop databases
buffalo pop drop -a
```

## 🔌 API Examples

### Health Check

```bash
curl http://localhost:3000/

# Response:
# {"message":"Welcome to Buffalo!"}
```

### List All Users

```bash
curl http://localhost:3000/api/users

# Response:
# [
#   {
#     "id": "550e8400-e29b-41d4-a716-446655440000",
#     "name": "John Doe",
#     "email": "john@example.com",
#     "encrypted_password": "...",
#     "created_at": "2025-11-08T07:43:59Z",
#     "updated_at": "2025-11-08T07:43:59Z"
#   }
# ]
```

### Create a User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "encrypted_password": "hashed_password_here"
  }'

# Response (201 Created):
# {
#   "id": "550e8400-e29b-41d4-a716-446655440001",
#   "name": "Jane Smith",
#   "email": "jane@example.com",
#   "encrypted_password": "hashed_password_here",
#   "created_at": "2025-11-08T08:00:00Z",
#   "updated_at": "2025-11-08T08:00:00Z"
# }
```

### Get a Specific User

```bash
curl http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440001

# Response (200 OK):
# {
#   "id": "550e8400-e29b-41d4-a716-446655440001",
#   "name": "Jane Smith",
#   "email": "jane@example.com",
#   "encrypted_password": "...",
#   "created_at": "2025-11-08T08:00:00Z",
#   "updated_at": "2025-11-08T08:00:00Z"
# }
```

### Update a User

```bash
curl -X PUT http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com"
  }'

# Response (200 OK): Updated user object
```

### Delete a User

```bash
curl -X DELETE http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440001

# Response (204 No Content)
```

## 🆕 Creating New Resources

### Step 1: Generate a Model

```bash
buffalo pop generate model post title:string content:text user_id:uuid

# This creates:
# - models/post.go
# - models/post_test.go
# - migrations/XXXXXX_create_posts.up.fizz
# - migrations/XXXXXX_create_posts.down.fizz
```

### Step 2: Run Migrations

```bash
buffalo pop migrate up
```

### Step 3: Generate Actions (API Endpoints)

```bash
buffalo generate action post list show create update destroy
```

This creates `actions/post.go` with CRUD handlers.

### Step 4: Add Routes

Edit `actions/app.go`:

```go
func App() *buffalo.App {
    app := buffalo.New(buffalo.Options{...})
    
    api := app.Group("/api")
    
    // Users routes
    api.Resource("users", UsersResource{})
    
    // Posts routes
    api.Resource("posts", PostsResource{})
    
    return app
}
```

### Step 5: Test the Endpoints

```bash
# List all posts
curl http://localhost:3000/api/posts

# Create a post
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post","content":"Content here","user_id":"<user-uuid>"}'
```

## 🧪 Testing

Buffalo includes testing utilities for unit and integration tests.

### Running Tests

```bash
# Run all tests
buffalo test

# Run tests for a specific package
buffalo test ./models

# Run with verbose output
buffalo test -v

# Run with coverage
buffalo test -cover
```

### Example Test

```go
// models/user_test.go
package models_test

import (
    "testing"
    "api21/models"
    "github.com/stretchr/testify/require"
)

func TestUser(t *testing.T) {
    t.Run("Validate", func(st *testing.T) {
        u := &models.User{
            Name:              "John",
            Email:             "john@example.com",
            EncryptedPassword: "password",
        }
        
        verrs, _ := u.Validate(nil)
        require.NoError(st, verrs.Error())
    })
}
```

## 🐳 Deployment

### Building for Production

```bash
# Build the binary
buffalo build

# Output: bin/api21
```

### Docker Deployment

```bash
# Build Docker image
docker build -t api21:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgres://user:pass@db:5432/api21_prod" \
  -e GO_ENV=production \
  api21:latest

# Using docker-compose
docker-compose up -d
```

### Environment Variables for Production

```bash
export GO_ENV=production
export DATABASE_URL=postgres://user:password@prod-db.example.com:5432/api21_prod
export PORT=3000
./bin/api21
```

## 🔧 Troubleshooting

### Issue: Database Connection Failed

```
Error: dial postgres - Connection refused
```

**Solution:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check database credentials in `.env` and `database.yml`
3. Ensure the database exists: `buffalo pop create -a`

### Issue: Migration Errors

```
Error: migration already applied
```

**Solution:**
1. Check migration status: `buffalo pop migrate status`
2. Ensure migrations are idempotent
3. Run migrations in order without skipping versions

### Issue: Hot-reload Not Working

```
buffalo dev
# No automatic rebuild on file changes
```

**Solution:**
1. Install `air`: `go install github.com/cosmtrek/air@latest`
2. Ensure `.buffalo.dev.yml` exists in project root
3. Check file permissions

### Issue: Port Already in Use

```
Error: listen tcp :3000: bind: address already in use
```

**Solution:**
```bash
# Use a different port
PORT=8080 buffalo dev

# Or kill the process using port 3000
lsof -i :3000
kill -9 <PID>
```

## 📚 Resources

### Official Documentation

- [Buffalo Documentation](https://gobuffalo.io/en/docs/overview)
- [Pop ORM Documentation](https://gobuffalo.io/en/docs/db/getting-started)
- [Go Language Docs](https://golang.org/doc/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Useful Commands

```bash
# Application commands
buffalo new <name>                    # Create new Buffalo app
buffalo dev                           # Run with hot-reload
buffalo build                         # Build production binary
buffalo test                          # Run tests
buffalo routes                        # Show all routes
buffalo generate --help               # Show generate options

# Database commands
buffalo pop create -a                 # Create all databases
buffalo pop drop -a                   # Drop all databases
buffalo pop migrate up                # Apply migrations
buffalo pop migrate down              # Rollback migration
buffalo pop migrate status            # Show migration status
buffalo pop generate migration <name> # Create migration
buffalo pop generate model <name>     # Create model

# Model commands
buffalo generate action <name>        # Create action/handler
buffalo generate resource <name>      # Create full REST resource
buffalo generate mailer <name>        # Create mailer
buffalo generate task <name>          # Create task/grift
```

## 📝 Contributing

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Write tests for new functionality
4. Run tests: `buffalo test`
5. Commit changes: `git commit -am 'Add new feature'`
6. Push to branch: `git push origin feature/your-feature`
7. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For issues and questions:

- Check the [Buffalo Docs](https://gobuffalo.io/)
- Review [existing issues](https://github.com/Abhay2133/api21/issues)
- Create a new issue with detailed information

---

**Happy coding! 🚀**
