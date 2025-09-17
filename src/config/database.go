package config

import (
	"log"
	"os"
	"path/filepath"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase initializes the database connection based on environment
func InitDatabase() {
	var err error

	// Check for DATABASE_URL (production PostgreSQL)
	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL != "" {
		// Production: Use PostgreSQL
		log.Println("[DATABASE] Connecting to PostgreSQL...")
		DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			log.Fatalf("[DATABASE] Failed to connect to PostgreSQL: %v", err)
		}
		log.Println("[DATABASE] Successfully connected to PostgreSQL")
	} else {
		// Development: Use SQLite
		log.Println("[DATABASE] Using SQLite for development...")

		// Ensure tmp directory exists
		tmpDir := "./tmp"
		if err := os.MkdirAll(tmpDir, 0755); err != nil {
			log.Fatalf("[DATABASE] Failed to create tmp directory: %v", err)
		}

		// SQLite database path in tmp directory
		dbPath := filepath.Join(tmpDir, "api21.db")
		DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			log.Fatalf("[DATABASE] Failed to connect to SQLite: %v", err)
		}
		log.Printf("[DATABASE] Successfully connected to SQLite at %s", dbPath)
	}
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}

// SetDB sets the database instance (used for testing)
func SetDB(db *gorm.DB) {
	DB = db
}

// CloseDatabase closes the database connection
func CloseDatabase() {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			log.Printf("[DATABASE] Error getting underlying sql.DB: %v", err)
			return
		}

		if err := sqlDB.Close(); err != nil {
			log.Printf("[DATABASE] Error closing database: %v", err)
		} else {
			log.Println("[DATABASE] Database connection closed")
		}
	}
}
