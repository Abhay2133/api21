package database

import (
	"fmt"
	"log"

	"api21/internal/config"
	"api21/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect establishes a connection to the database
func Connect(cfg *config.Config) error {
	var dialector gorm.Dialector

	switch cfg.Database.Driver {
	case "sqlite":
		// SQLite for development
		dbPath := cfg.Database.DBName
		if dbPath == "" || dbPath == "api21_db" {
			dbPath = "api21.db"
		}
		dialector = sqlite.Open(dbPath)
		log.Printf("🔧 Using SQLite database: %s", dbPath)

	case "postgres":
		// PostgreSQL for production
		dsn := fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
			cfg.Database.Host,
			cfg.Database.User,
			cfg.Database.Password,
			cfg.Database.DBName,
			cfg.Database.Port,
			cfg.Database.SSLMode,
		)
		dialector = postgres.Open(dsn)
		log.Printf("🔧 Using PostgreSQL database: %s@%s:%s/%s",
			cfg.Database.User, cfg.Database.Host, cfg.Database.Port, cfg.Database.DBName)

	default:
		return fmt.Errorf("unsupported database driver: %s (supported: sqlite, postgres)", cfg.Database.Driver)
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to %s database: %w", cfg.Database.Driver, err)
	}

	DB = db
	log.Printf("✅ %s database connected successfully", cfg.Database.Driver)
	return nil
}

// Migrate runs database migrations
func Migrate() error {
	if DB == nil {
		return fmt.Errorf("database connection is not established")
	}

	err := DB.AutoMigrate(
		&models.User{},
		&models.Item{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("✅ Database migration completed")
	return nil
}

// Close closes the database connection
func Close() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}
