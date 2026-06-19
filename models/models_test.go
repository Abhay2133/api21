package models

import (
	"log"
	"os"
	"path/filepath"
	"testing"
)

func TestMain(m *testing.M) {
	// Set test environment
	os.Setenv("GO_ENV", "test")

	// Change working directory to project root so database path resolutions are consistent
	if err := os.Chdir(".."); err != nil {
		log.Fatalf("failed to change directory to project root: %s", err)
	}

	// Delete test sqlite file if it exists to start fresh
	dbPath := filepath.Join("server", "db", "test.sqlite3")
	os.Remove(dbPath)

	// Initialize the test DB
	InitDB()

	// Auto-migrate tables
	if err := DB.AutoMigrate(&User{}); err != nil {
		log.Fatalf("failed to auto-migrate database for tests: %s", err)
	}

	code := m.Run()

	// Clean up test DB
	os.Remove(dbPath)

	os.Exit(code)
}
