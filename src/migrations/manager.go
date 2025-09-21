package migrations

import (
	"fmt"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"gorm.io/gorm"
)

// MigrationManager handles database migrations using golang-migrate
type MigrationManager struct {
	migrate *migrate.Migrate
	db      *gorm.DB
}

// NewMigrationManager creates a new migration manager
func NewMigrationManager(db *gorm.DB) (*MigrationManager, error) {
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Determine database driver and create appropriate driver instance
	var driver database.Driver
	var driverErr error

	// Check if we're using PostgreSQL or SQLite
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		// PostgreSQL
		driver, driverErr = postgres.WithInstance(sqlDB, &postgres.Config{})
	} else {
		// SQLite
		driver, driverErr = sqlite3.WithInstance(sqlDB, &sqlite3.Config{})
	}

	if driverErr != nil {
		return nil, fmt.Errorf("failed to create database driver: %w", driverErr)
	}

	// Create migrate instance
	m, err := migrate.NewWithDatabaseInstance(
		"file://migrations",
		getDatabaseName(), driver)
	if err != nil {
		return nil, fmt.Errorf("failed to create migrate instance: %w", err)
	}

	return &MigrationManager{
		migrate: m,
		db:      db,
	}, nil
}

// getDatabaseName returns the database name based on the environment
func getDatabaseName() string {
	if os.Getenv("DATABASE_URL") != "" {
		return "postgres"
	}
	return "sqlite3"
}

// Up runs all pending migrations
func (m *MigrationManager) Up() error {
	log.Println("[MIGRATION] Running pending migrations...")

	err := m.migrate.Up()
	if err != nil {
		if err == migrate.ErrNoChange {
			log.Println("[MIGRATION] No pending migrations")
			return nil
		}
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("[MIGRATION] All migrations completed successfully")
	return nil
}

// Down rolls back one migration
func (m *MigrationManager) Down() error {
	log.Println("[MIGRATION] Rolling back last migration...")

	err := m.migrate.Steps(-1)
	if err != nil {
		if err == migrate.ErrNoChange {
			log.Println("[MIGRATION] No migrations to roll back")
			return nil
		}
		return fmt.Errorf("failed to rollback migration: %w", err)
	}

	log.Println("[MIGRATION] Migration rolled back successfully")
	return nil
}

// DownTo rolls back to a specific version
func (m *MigrationManager) DownTo(version uint) error {
	log.Printf("[MIGRATION] Rolling back to version %d...", version)

	err := m.migrate.Migrate(version)
	if err != nil {
		if err == migrate.ErrNoChange {
			log.Printf("[MIGRATION] Already at version %d", version)
			return nil
		}
		return fmt.Errorf("failed to migrate to version %d: %w", version, err)
	}

	log.Printf("[MIGRATION] Successfully migrated to version %d", version)
	return nil
}

// Reset rolls back all migrations
func (m *MigrationManager) Reset() error {
	log.Println("[MIGRATION] Rolling back all migrations...")

	err := m.migrate.Down()
	if err != nil {
		if err == migrate.ErrNoChange {
			log.Println("[MIGRATION] No migrations to roll back")
			return nil
		}
		return fmt.Errorf("failed to reset migrations: %w", err)
	}

	log.Println("[MIGRATION] All migrations rolled back successfully")
	return nil
}

// Drop drops all tables and removes migration history
func (m *MigrationManager) Drop() error {
	log.Println("[MIGRATION] Dropping all tables and migration history...")

	err := m.migrate.Drop()
	if err != nil {
		return fmt.Errorf("failed to drop database: %w", err)
	}

	log.Println("[MIGRATION] Database dropped successfully")
	return nil
}

// Version returns the current migration version
func (m *MigrationManager) Version() (uint, bool, error) {
	version, dirty, err := m.migrate.Version()
	if err != nil {
		if err == migrate.ErrNilVersion {
			return 0, false, nil
		}
		return 0, false, fmt.Errorf("failed to get migration version: %w", err)
	}

	return version, dirty, nil
}

// Force sets the migration version without running migrations
func (m *MigrationManager) Force(version int) error {
	log.Printf("[MIGRATION] Forcing migration version to %d...", version)

	err := m.migrate.Force(version)
	if err != nil {
		return fmt.Errorf("failed to force migration version: %w", err)
	}

	log.Printf("[MIGRATION] Migration version forced to %d", version)
	return nil
}

// Close closes the migration manager
func (m *MigrationManager) Close() error {
	if m.migrate != nil {
		sourceErr, dbErr := m.migrate.Close()
		if sourceErr != nil {
			return fmt.Errorf("failed to close migration source: %w", sourceErr)
		}
		if dbErr != nil {
			return fmt.Errorf("failed to close migration database: %w", dbErr)
		}
	}
	return nil
}

// RunMigrations is a convenience function to run migrations during application startup
func RunMigrations(db *gorm.DB) error {
	manager, err := NewMigrationManager(db)
	if err != nil {
		return fmt.Errorf("failed to create migration manager: %w", err)
	}
	// NOTE: We intentionally don't call manager.Close() here to avoid closing
	// the underlying database connection that GORM is using. The migrate
	// instance will be garbage collected when the manager goes out of scope.

	return manager.Up()
}
