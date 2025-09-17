# Migrations Directory

This directory contains database migration files managed by [golang-migrate](https://github.com/golang-migrate/migrate).

## Migration File Naming Convention

Migration files follow the pattern:
```
{version}_{name}.{direction}.sql
```

For example:
- `000001_create_users_table.up.sql`
- `000001_create_users_table.down.sql`

## Usage

### Create a new migration
```bash
make migration-create name=create_posts_table
```

### Run migrations
```bash
make migrate-up      # Run all pending migrations
make migrate-down    # Rollback last migration
make migrate-reset   # Rollback all migrations
make migrate-drop    # Drop all tables and remove migration history
```

### Check migration status
```bash
make migrate-version  # Show current migration version
```

## File Structure

- `*.up.sql` - Contains the forward migration (applying changes)
- `*.down.sql` - Contains the reverse migration (rolling back changes)

Each migration should be atomic and reversible.