package database

import (
	"embed"
	"log"
	"time"

	"github.com/pressly/goose/v3"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

//go:embed migrations/*.sql
var embedMigrations embed.FS

func NewPostgresConnection(dsn string) (*gorm.DB, error) {
	log.Printf("[database] connecting to PostgreSQL...")
	
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// Configure connection pool for scalability
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("[database] connection established. Running migrations via Goose...")
	
	goose.SetBaseFS(embedMigrations)
	if err := goose.SetDialect("postgres"); err != nil {
		return nil, err
	}

	if err := goose.Up(sqlDB, "migrations"); err != nil {
		return nil, err
	}
	
	log.Println("[database] database migrations completed successfully.")
	return db, nil
}
