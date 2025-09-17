package utils

import (
	"api21/src/config"
	"api21/src/models"
	"log"
	"os"
	"path/filepath"
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// TestDB holds the test database instance
var TestDB *gorm.DB

// SetupTestDB initializes a test database
func SetupTestDB(t *testing.T) {
	// Create a temporary database file for testing
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "test.db")

	// Initialize database connection
	var err error
	TestDB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent), // Suppress logs during testing
	})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Set the test database in config
	config.SetDB(TestDB)

	// Run migrations
	err = TestDB.AutoMigrate(&models.User{}, &models.Clipboard{})
	if err != nil {
		t.Fatalf("Failed to migrate test database: %v", err)
	}
}

// CleanupTestDB cleans up the test database
func CleanupTestDB(t *testing.T) {
	if TestDB != nil {
		// Get underlying sql.DB to close the connection
		sqlDB, err := TestDB.DB()
		if err == nil {
			sqlDB.Close()
		}
	}
}

// TruncateTables clears all data from test tables
func TruncateTables(t *testing.T) {
	if TestDB == nil {
		t.Fatal("Test database not initialized")
	}

	// Clear all tables
	TestDB.Exec("DELETE FROM clipboard")
	TestDB.Exec("DELETE FROM users")
	
	// Reset auto-increment counters
	TestDB.Exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'clipboard')")
}

// CreateTestUser creates a test user and returns it
func CreateTestUser(name, email string) *models.User {
	user := models.NewUser(name, email)
	err := user.CreateUser()
	if err != nil {
		log.Fatalf("Failed to create test user: %v", err)
	}
	return user
}

// CreateTestClipboard creates a test clipboard entry and returns it
func CreateTestClipboard(title, content string) *models.Clipboard {
	clipboard := models.NewClipboard(title, content)
	err := clipboard.CreateClipboard()
	if err != nil {
		log.Fatalf("Failed to create test clipboard: %v", err)
	}
	return clipboard
}

// GetEnvOrDefault returns environment variable value or default
func GetEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}