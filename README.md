# API21 - Golang Fiber MVC Framework

A RESTful API built with Go using the Fiber web framework following the MVC (Model-View-Controller) pattern with GORM ORM and database support.

## 🚀 Features

- **MVC Architecture**: Clean separation of concerns with Models, Controllers, and Routes
- **Fiber Framework**: Fast HTTP web framework for Go
- **GORM ORM**: Advanced ORM for database operations and model management
- **Database Migrations**: Robust migration system using golang-migrate with version control and rollback support
- **Multi-Database Support**: PostgreSQL for production, SQLite for development
- **Environment-Based Configuration**: Automatic database selection based on environment
- **Middleware Support**: Logger, CORS, and Recover middleware pre-configured
- **JSON API**: RESTful endpoints returning JSON responses
- **Cron Jobs**: Background scheduled tasks for monitoring and health checks
- **Graceful Shutdown**: Proper cleanup of resources and background processes
- **Makefile**: Simple commands for building, running, and managing the project
- **Cross-platform Build**: Support for Linux, Windows, and macOS builds

## 📁 Project Structure

```
api21/
├── migrations/              # Database migration files (golang-migrate)
│   ├── README.md           # Migration system documentation
│   ├── 000001_create_users_table.up.sql
│   └── 000001_create_users_table.down.sql
├── src/
│   ├── config/
│   │   └── database.go      # Database configuration and connection
│   ├── migrations/
│   │   └── manager.go       # Migration system integration
│   ├── models/
│   │   └── user.go          # User model with GORM methods
│   ├── controllers/
│   │   └── user_controller.go # User HTTP handlers with database operations
│   ├── routes/
│   │   └── routes.go        # Route definitions
│   └── cron_jobs.go         # Background cron job definitions
├── tests/                   # Test suite
│   ├── controllers/         # Integration tests for HTTP controllers
│   ├── models/             # Unit tests for data models
│   ├── utils/              # Test utilities and helpers
│   └── README.md           # Testing documentation
├── bin/                     # Build output directory
├── public/                  # Static files directory
├── tmp/                     # Development database storage (SQLite)
├── main.go                  # Application entry point
├── go.mod                   # Go module file
├── go.sum                   # Go dependencies checksum
├── Makefile                 # Build and run commands
├── .env.example            # Environment variables template
├── MIGRATIONS.md           # Detailed migration documentation
└── README.md               # This file
```

## 🛠️ Prerequisites

- Go 1.19 or higher
- Make (optional, for using Makefile commands)
- PostgreSQL (for production)

## 🗄️ Database Configuration

The application supports dual database configuration:

### Development Mode (Default)
- **Database**: SQLite
- **File**: `./tmp/api21.db` (created automatically in tmp directory)
- **Configuration**: No setup required

### Production Mode
- **Database**: PostgreSQL
- **Trigger**: Set `DATABASE_URL` environment variable
- **Format**: `postgres://username:password@localhost:5432/database_name`

The application automatically chooses the database based on the presence of the `DATABASE_URL` environment variable.

## � Database Migrations

API21 uses [golang-migrate](https://github.com/golang-migrate/migrate) for database schema management.

### Quick Migration Commands
```bash
# Create a new migration
make migration-create name=create_products_table

# Apply pending migrations
make migrate-up

# Rollback last migration
make migrate-down

# Check migration status
make migrate-version
```

**📖 For complete migration documentation, see the Migration System Documentation section below**

## �🚀 Quick Start

### 1. Clone and Setup
```bash
# Navigate to the project directory
cd api21

# Install dependencies
make install
# or
go mod tidy

# Optional: Configure environment variables
cp .env.example .env
# Edit .env file with your preferred settings
```

### 2. Run the Application
```bash
# Using Makefile (loads .env automatically)
make run

# Or directly with Go
go run main.go

# Run with example ping job configuration
make run-with-ping
```

The server will start on `http://localhost:3000`

**Note**: Database migrations are automatically applied on application startup.

### 3. Build the Application
```bash
# Build for current platform
make build

# Build for all platforms
make build-all
```

## � Available Commands

### Application Management
| Command | Description |
|---------|-------------|
| `make run` | Run the application in development mode |
| `make run-with-ping` | Run with ping job enabled |
| `make build` | Build the application binary |
| `make build-all` | Build for all platforms (Linux, Windows, macOS) |
| `make clean` | Clean build artifacts |
| `make dev` | Run with auto-reload (requires air) |
| `make test` | Run tests |
| `make help` | Display all available commands |

### Database Migrations
| Command | Description |
|---------|-------------|
| `make migration-create name=<name>` | Create new migration files |
| `make migrate-up` | Apply all pending migrations |
| `make migrate-down` | Rollback last migration |
| `make migrate-down-all` | Rollback all migrations |
| `make migrate-version` | Show current migration version |
| `make migrate-goto version=<n>` | Migrate to specific version |
| `make migrate-force version=<n>` | Force version (emergency use) |
| `make migrate-drop` | Drop all tables (⚠️ DESTRUCTIVE) |
| `make migrate-install` | Install golang-migrate CLI |

### Development Tools
| Command | Description |
|---------|-------------|
| `make install` | Install dependencies |
| `make fmt` | Format code |
| `make lint` | Run linter |
| `make deps` | Show dependency graph |
| `make mod-update` | Update all dependencies |

## �📚 API Endpoints

### Health Check
- **GET** `/api/health` - Check API health status

### Users
- **GET** `/api/users` - Get all users from database
- **GET** `/api/users/:id` - Get user by ID from database
- **POST** `/api/users` - Create a new user in database
- **PUT** `/api/users/:id` - Update an existing user in database
- **DELETE** `/api/users/:id` - Delete a user from database

### Root
- **GET** `/` - Welcome message with available endpoints

## ⏰ Background Cron Jobs

The application includes automated background tasks that run on scheduled intervals:

### Memory Monitor
- **Schedule**: Every minute (`:00` seconds)
- **Function**: Logs current memory usage statistics including allocated memory, total allocations, system memory, and garbage collection count
- **Purpose**: System monitoring and performance tracking

### URL Health Check Ping
- **Schedule**: Configurable via `PING_INTERVAL` environment variable (in minutes)
- **Function**: Sends GET requests to a configured URL and logs response status and duration
- **Configuration**:
  - `PING_URL`: Target URL to ping (required)
  - `PING_INTERVAL`: Interval in minutes between pings (required, must be positive integer)
- **Error Handling**: Gracefully handles network errors and invalid configurations
- **Auto-skip**: Job is automatically skipped if environment variables are missing or invalid

### Environment Variables

The application supports environment variable configuration through:
1. **System environment variables**
2. **`.env` file** (recommended for development)

#### Option 1: Using .env File (Recommended)
```bash
# Copy the example file and customize
cp .env.example .env

# Edit .env file with your configuration
# Example .env content:
PING_URL=https://your-api.com/health
PING_INTERVAL=5
```

#### Option 2: System Environment Variables
```bash
# Set environment variables and run
export PING_URL="https://your-api.com/health"
export PING_INTERVAL="5"  # Ping every 5 minutes
make run
```

#### Available Variables
- `DATABASE_URL`: PostgreSQL connection string for production (optional, format: `postgres://user:pass@host:port/dbname`)
- `PING_URL`: Target URL for health check pings (optional)
- `PING_INTERVAL`: Ping interval in minutes - must be positive integer (optional)

**Note**: If using both methods, system environment variables take precedence over .env file values.

## 📝 Example API Responses

### Get All Users
```bash
curl http://localhost:3000/api/users
```

Response:
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "count": 3
}
```

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com"}'
```

Response:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 4,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

## 🔧 Available Make Commands

```bash
make help           # Display available commands
make run            # Run the application in development mode
make run-with-ping  # Run with ping job enabled (example configuration)
make build          # Build the application binary
make clean          # Clean build artifacts
make dev            # Run with auto-reload (requires air)
make test           # Run tests
make install        # Install dependencies
make fmt            # Format code
make lint           # Run linter
make deps           # Show dependency graph
make mod-update     # Update all dependencies

# Cross-platform builds
make build-linux    # Build for Linux
make build-windows  # Build for Windows
make build-mac      # Build for macOS
make build-all      # Build for all platforms
```

## 🏗️ Architecture

### MVC Pattern

- **Models** (`src/models/`): GORM-based data structures with database methods and business logic
- **Controllers** (`src/controllers/`): HTTP request handlers with database operations and response logic
- **Routes** (`src/routes/`): Route definitions and middleware setup

### Database Layer

- **GORM ORM**: Object-Relational Mapping for database operations
- **Multi-Database Support**: SQLite for development, PostgreSQL for production
- **Migration System**: Version-controlled schema changes using golang-migrate
- **Automatic Connection**: Database selection based on environment variables

### Middleware Stack

1. **Logger**: Logs all HTTP requests with details
2. **Recover**: Recovers from panics and returns 500 status with error details
3. **CORS**: Enables Cross-Origin Resource Sharing (allows all origins in development)
4. **Static**: Serves static files from the `public/` directory

## 🔧 Configuration

The application is configured in `main.go` with:
- **Port**: 3000 (configurable)
- **CORS**: Allows all origins in development
- **Logging**: Enabled for all requests

## 🧪 Development

### Auto-reload Development
```bash
# Install air for auto-reload
go install github.com/cosmtrek/air@latest

# Run with auto-reload
make dev
```

### Code Formatting
```bash
make fmt
```

### Running Tests
```bash
# Run all tests
make test

# Run model tests only
make test-models

# Run controller tests only  
make test-controllers

# Generate coverage report
make test-coverage

# Run tests in watch mode (requires entr)
make test-watch

# Clean test artifacts
make test-clean
```

The project includes a comprehensive test suite with:
- **Unit Tests**: Model validation and CRUD operations
- **Integration Tests**: Full HTTP endpoint testing
- **Test Utilities**: Helpers for database setup and test data creation
- **Coverage Reports**: HTML coverage reports generated in `coverage/`

See [tests/README.md](tests/README.md) for detailed testing documentation.

## 📦 Dependencies

### Core Framework
- [Fiber v2](https://github.com/gofiber/fiber) - Fast web framework for Go
- [GORM](https://gorm.io/) - The fantastic ORM library for Golang

### Database
- [GORM SQLite Driver](https://github.com/go-gorm/sqlite) - SQLite driver for GORM (development)
- [GORM PostgreSQL Driver](https://github.com/go-gorm/postgres) - PostgreSQL driver for GORM (production)
- [golang-migrate](https://github.com/golang-migrate/migrate) - Database migration tool

### Background Jobs & Utilities
- [Cron v3](https://github.com/robfig/cron) - Cron job scheduler for Go
- [GoDotEnv](https://github.com/joho/godotenv) - Load environment variables from .env files

### Testing
- [Testify](https://github.com/stretchr/testify) - Testing toolkit with assertions and test suites
- Standard Go testing package for unit and integration tests

### Standard Libraries
- Standard Go libraries (context, os, signal, syscall, time, net/http, runtime)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `make fmt` and `make lint`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Fiber Documentation](https://docs.gofiber.io/) - Web framework documentation
- [GORM Documentation](https://gorm.io/docs/) - ORM library documentation  
- [golang-migrate Documentation](https://github.com/golang-migrate/migrate) - Database migration tool
- [Go Documentation](https://golang.org/doc/) - Official Go documentation

## 📋 Migration System Documentation

API21 uses [golang-migrate/migrate](https://github.com/golang-migrate/migrate) for database migrations, providing a robust and reliable migration system.

### Migration Features

- ✅ **Version Control**: Track and manage database schema versions
- ✅ **Rollback Support**: Safely rollback migrations when needed
- ✅ **Multi-Database Support**: Works with both SQLite (development) and PostgreSQL (production)
- ✅ **CLI Integration**: Easy-to-use Makefile commands
- ✅ **Application Integration**: Automatic migrations on application startup
- ✅ **Sequential Migrations**: Migrations are applied in order
- ✅ **Atomic Operations**: Each migration runs in a transaction

### Quick Migration Guide

#### 1. Install Migration CLI (if not already installed)
```bash
make migrate-install
```

#### 2. Create Your First Migration
```bash
make migration-create name=create_products_table
```

This creates two files:
- `migrations/000003_create_products_table.up.sql` - Forward migration
- `migrations/000003_create_products_table.down.sql` - Rollback migration

#### 3. Edit Migration Files

**000003_create_products_table.up.sql:**
```sql
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
```

**000003_create_products_table.down.sql:**
```sql
DROP TABLE IF EXISTS products;
```

#### 4. Apply Migrations
```bash
make migrate-up
```

### Migration File Structure

```
migrations/
├── README.md
├── 000001_create_users_table.up.sql
├── 000001_create_users_table.down.sql
├── 000002_add_posts_table.up.sql
├── 000002_add_posts_table.down.sql
└── ...
```

#### Naming Convention
- **Sequential Numbers**: `000001`, `000002`, etc.
- **Descriptive Names**: `create_users_table`, `add_email_index`
- **Direction**: `.up.sql` (forward), `.down.sql` (rollback)

### Migration Best Practices

#### 1. Migration Content
- **Always** include `IF NOT EXISTS` for CREATE statements
- **Always** include `IF EXISTS` for DROP statements
- Use descriptive column names and appropriate data types
- Add indexes for frequently queried columns

#### 2. Rollback Strategy
- Every `.up.sql` must have a corresponding `.down.sql`
- Test rollbacks in development before production
- Keep rollbacks simple and safe

#### 3. Schema Changes
- **Additive changes** are safer (adding columns, tables, indexes)
- **Destructive changes** need careful planning (dropping columns, changing types)
- Consider data migration separately from schema changes

#### 4. Version Control
- Commit migration files with your code changes
- Never modify existing migration files after they're applied in production
- Create new migrations to fix issues

### Migration Examples

#### Creating a Table
```sql
-- up.sql
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- down.sql
DROP TABLE IF EXISTS categories;
```

#### Adding a Column
```sql
-- up.sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- down.sql
ALTER TABLE users DROP COLUMN phone;
```

#### Adding an Index
```sql
-- up.sql
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- down.sql
DROP INDEX IF EXISTS idx_users_created_at;
```

#### Foreign Key Relationship
```sql
-- up.sql
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- down.sql
DROP TABLE IF EXISTS orders;
```

### Troubleshooting Migrations

#### Common Issues

**1. Migration fails to apply**
```bash
# Check current status
make migrate-version

# Force to specific version if needed (emergency)
make migrate-force version=1
```

**2. Database is dirty**
```bash
# Check what went wrong and fix manually, then:
make migrate-force version=<correct_version>
```

**3. Want to start fresh**
```bash
# ⚠️ This will delete ALL data
make migrate-drop
make migrate-up
```

#### Debugging
- Check the `schema_migrations` table in your database
- Migration files are in `migrations/` directory
- Application logs show migration status during startup

### Production Deployment

1. **Test migrations** in staging environment first
2. **Backup database** before applying migrations
3. **Apply migrations** during maintenance window if needed
4. **Monitor** application startup logs
5. **Have rollback plan** ready

## 📚 Documentation Updates Summary

This section summarizes the recent documentation updates made to reflect the migration system implementation.

### Key Documentation Changes

#### 1. Enhanced Architecture Documentation
- ✅ Updated project overview to mention database migrations with golang-migrate
- ✅ Added database architecture section explaining SQLite/PostgreSQL setup
- ✅ Added migration system details including file format and management
- ✅ Updated MVC structure to mention GORM-based models
- ✅ Added comprehensive migration commands to development workflow
- ✅ Updated environment variables to include DATABASE_URL

#### 2. Migration System Integration
The documentation now properly reflects that API21 has moved from:

**Before (Old System)**
- Mock data in models
- GORM AutoMigrate for schema management
- No version control for database changes
- Limited rollback capabilities

**After (New System)**  
- Real database operations with GORM
- golang-migrate for robust schema management
- Version-controlled migrations with up/down files
- Full rollback and migration management capabilities
- Support for both SQLite (dev) and PostgreSQL (prod)

#### 3. Comprehensive Command Reference
All migration commands are now documented with clear usage examples:
- `make migration-create name=<name>`
- `make migrate-up/down`
- `make migrate-version`
- Database URL detection from `.env` file, environment variables, or fallback to SQLite

#### 4. Clear Architecture Documentation
The documentation now clearly explains:
- Database layer architecture
- Migration system integration
- Environment-based database selection
- Application lifecycle including migrations

#### 5. Developer-Friendly Examples
Practical examples for:
- Creating migrations
- Adding tables, columns, indexes
- Handling foreign keys
- Rolling back changes
- Production deployment

### Migration System Features Summary

#### Core Benefits
- **Robust Version Control**: Track and manage database schema versions with precision
- **Safe Rollback Support**: Confidently rollback migrations when needed
- **Multi-Database Compatibility**: Seamless support for SQLite (development) and PostgreSQL (production)
- **Integrated CLI Tools**: Easy-to-use Makefile commands for all migration operations
- **Automatic Application Integration**: Migrations run automatically on application startup
- **Sequential Processing**: Migrations are applied in correct order
- **Atomic Operations**: Each migration runs in a transaction for data integrity

#### Key Implementation Features
- **Environment-Based Configuration**: Automatic database selection based on `DATABASE_URL`
- **Developer Workflow Integration**: Migration commands integrated into Makefile
- **Production-Ready**: Safe deployment strategies and rollback procedures
- **Comprehensive Documentation**: Complete guides for development and production use

The migration system provides a solid foundation for managing database schema changes safely and reliably across all environments!