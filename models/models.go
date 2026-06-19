package models

import (
	"log"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB is a GORM connection to the database.
var DB *gorm.DB

func init() {
	InitDB()
}

// InitDB initializes the database connection. Exposed for testing.
func InitDB() {
	var err error
	env := os.Getenv("GO_ENV")
	if env == "" {
		env = "development"
	}

	dbFile := "dev.sqlite3"
	if env == "production" {
		dbFile = "production.sqlite3"
	} else if env == "test" {
		dbFile = "test.sqlite3"
	}

	// The databases are located in server/db/
	dbPath := filepath.Join("server", "db", dbFile)

	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		log.Fatalf("[db] failed to create database directory: %s", err)
	}

	// GORM logger config
	logLevel := logger.Error
	if env == "development" {
		logLevel = logger.Info
	}

	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("[db] failed to connect database: %s", err)
	}

	log.Printf("[db] connected to sqlite database at %s", dbPath)
}
