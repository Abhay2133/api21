# Migration System Documentation

API21 now uses [golang-migrate/migrate](https://github.com/golang-migrate/migrate) for database migrations, providing a robust and reliable migration system.

## Features

- ✅ **Version Control**: Track and manage database schema versions
- ✅ **Rollback Support**: Safely rollback migrations when needed
- ✅ **Multi-Database Support**: Works with both SQLite (development) and PostgreSQL (production)
- ✅ **CLI Integration**: Easy-to-use Makefile commands
- ✅ **Application Integration**: Automatic migrations on application startup
- ✅ **Sequential Migrations**: Migrations are applied in order
- ✅ **Atomic Operations**: Each migration runs in a transaction

## Quick Start

### 1. Install Migration CLI (if not already installed)
```bash
make migrate-install
```

### 2. Create Your First Migration
```bash
make migration-create name=create_products_table
```

This creates two files:
- `migrations/000003_create_products_table.up.sql` - Forward migration
- `migrations/000003_create_products_table.down.sql` - Rollback migration

### 3. Edit Migration Files

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

### 4. Apply Migrations
```bash
make migrate-up
```

## Available Commands

### Migration Management
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

### Installation
| Command | Description |
|---------|-------------|
| `make migrate-install` | Install golang-migrate CLI |

## Migration File Structure

```
migrations/
├── README.md
├── 000001_create_users_table.up.sql
├── 000001_create_users_table.down.sql
├── 000002_add_posts_table.up.sql
├── 000002_add_posts_table.down.sql
└── ...
```

### Naming Convention
- **Sequential Numbers**: `000001`, `000002`, etc.
- **Descriptive Names**: `create_users_table`, `add_email_index`
- **Direction**: `.up.sql` (forward), `.down.sql` (rollback)

## Database Support

### Development (SQLite)
```bash
# Automatically detected when DATABASE_URL is not set
DB_URL=sqlite3://tmp/api21.db
```

### Production (PostgreSQL)
```bash
# Automatically detected when DATABASE_URL is set
DATABASE_URL=postgres://user:pass@host:port/dbname
```

## Application Integration

Migrations run automatically when the application starts:

```go
// main.go
import "api21/src/migrations"

func main() {
    // ... database initialization ...
    
    // Run database migrations
    db := config.GetDB()
    if err := migrations.RunMigrations(db); err != nil {
        log.Fatalf("[MAIN] Failed to run database migrations: %v", err)
    }
    
    // ... rest of application startup ...
}
```

## Best Practices

### 1. Migration Content
- **Always** include `IF NOT EXISTS` for CREATE statements
- **Always** include `IF EXISTS` for DROP statements
- Use descriptive column names and appropriate data types
- Add indexes for frequently queried columns

### 2. Rollback Strategy
- Every `.up.sql` must have a corresponding `.down.sql`
- Test rollbacks in development before production
- Keep rollbacks simple and safe

### 3. Schema Changes
- **Additive changes** are safer (adding columns, tables, indexes)
- **Destructive changes** need careful planning (dropping columns, changing types)
- Consider data migration separately from schema changes

### 4. Version Control
- Commit migration files with your code changes
- Never modify existing migration files after they're applied in production
- Create new migrations to fix issues

## Examples

### Creating a Table
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

### Adding a Column
```sql
-- up.sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- down.sql
ALTER TABLE users DROP COLUMN phone;
```

### Adding an Index
```sql
-- up.sql
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- down.sql
DROP INDEX IF EXISTS idx_users_created_at;
```

### Foreign Key Relationship
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

## Troubleshooting

### Common Issues

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

### Debugging
- Check the `schema_migrations` table in your database
- Migration files are in `migrations/` directory
- Application logs show migration status during startup

## Production Deployment

1. **Test migrations** in staging environment first
2. **Backup database** before applying migrations
3. **Apply migrations** during maintenance window if needed
4. **Monitor** application startup logs
5. **Have rollback plan** ready

## Integration with CI/CD

```yaml
# Example GitHub Actions step
- name: Run Database Migrations
  run: |
    make migrate-up
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

This migration system provides a solid foundation for managing your database schema changes safely and reliably!