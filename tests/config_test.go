package tests

import (
	"os"
	"testing"

	"api21/internal/config"

	"github.com/stretchr/testify/assert"
)

func TestConfigLoad(t *testing.T) {
	// Save original environment variables
	originalPort := os.Getenv("PORT")
	originalDBHost := os.Getenv("DB_HOST")
	originalDBPort := os.Getenv("DB_PORT")
	originalDBUser := os.Getenv("DB_USER")
	originalDBPassword := os.Getenv("DB_PASSWORD")
	originalDBName := os.Getenv("DB_NAME")
	originalDBSSLMode := os.Getenv("DB_SSLMODE")

	// Clean up function
	cleanup := func() {
		os.Setenv("PORT", originalPort)
		os.Setenv("DB_HOST", originalDBHost)
		os.Setenv("DB_PORT", originalDBPort)
		os.Setenv("DB_USER", originalDBUser)
		os.Setenv("DB_PASSWORD", originalDBPassword)
		os.Setenv("DB_NAME", originalDBName)
		os.Setenv("DB_SSLMODE", originalDBSSLMode)
	}
	defer cleanup()

	t.Run("Default values when env vars not set", func(t *testing.T) {
		// Clear environment variables
		os.Unsetenv("PORT")
		os.Unsetenv("DB_HOST")
		os.Unsetenv("DB_PORT")
		os.Unsetenv("DB_USER")
		os.Unsetenv("DB_PASSWORD")
		os.Unsetenv("DB_NAME")
		os.Unsetenv("DB_SSLMODE")

		cfg := config.Load()

		assert.Equal(t, "3000", cfg.Port)
		assert.Equal(t, "localhost", cfg.Database.Host)
		assert.Equal(t, "5432", cfg.Database.Port)
		assert.Equal(t, "postgres", cfg.Database.User)
		assert.Equal(t, "", cfg.Database.Password)
		assert.Equal(t, "api21_db", cfg.Database.DBName)
		assert.Equal(t, "disable", cfg.Database.SSLMode)
	})

	t.Run("Custom values from environment variables", func(t *testing.T) {
		// Set custom environment variables
		os.Setenv("PORT", "8080")
		os.Setenv("DB_HOST", "custom-host")
		os.Setenv("DB_PORT", "5433")
		os.Setenv("DB_USER", "custom-user")
		os.Setenv("DB_PASSWORD", "custom-password")
		os.Setenv("DB_NAME", "custom_db")
		os.Setenv("DB_SSLMODE", "require")

		cfg := config.Load()

		assert.Equal(t, "8080", cfg.Port)
		assert.Equal(t, "custom-host", cfg.Database.Host)
		assert.Equal(t, "5433", cfg.Database.Port)
		assert.Equal(t, "custom-user", cfg.Database.User)
		assert.Equal(t, "custom-password", cfg.Database.Password)
		assert.Equal(t, "custom_db", cfg.Database.DBName)
		assert.Equal(t, "require", cfg.Database.SSLMode)
	})

	t.Run("Mixed environment variables (some set, some default)", func(t *testing.T) {
		// Set only some environment variables
		os.Unsetenv("PORT")
		os.Setenv("DB_HOST", "mixed-host")
		os.Unsetenv("DB_PORT")
		os.Setenv("DB_USER", "mixed-user")
		os.Unsetenv("DB_PASSWORD")
		os.Unsetenv("DB_NAME")
		os.Setenv("DB_SSLMODE", "prefer")

		cfg := config.Load()

		// Should use defaults for unset vars
		assert.Equal(t, "3000", cfg.Port)
		assert.Equal(t, "5432", cfg.Database.Port)
		assert.Equal(t, "", cfg.Database.Password)
		assert.Equal(t, "api21_db", cfg.Database.DBName)

		// Should use env vars for set vars
		assert.Equal(t, "mixed-host", cfg.Database.Host)
		assert.Equal(t, "mixed-user", cfg.Database.User)
		assert.Equal(t, "prefer", cfg.Database.SSLMode)
	})
}

// Test the Config and DatabaseConfig structs
func TestConfigStructs(t *testing.T) {
	t.Run("Config struct initialization", func(t *testing.T) {
		cfg := &config.Config{
			Port: "8080",
			Database: config.DatabaseConfig{
				Host:     "localhost",
				Port:     "5432",
				User:     "testuser",
				Password: "testpass",
				DBName:   "testdb",
				SSLMode:  "disable",
			},
		}

		assert.Equal(t, "8080", cfg.Port)
		assert.Equal(t, "localhost", cfg.Database.Host)
		assert.Equal(t, "5432", cfg.Database.Port)
		assert.Equal(t, "testuser", cfg.Database.User)
		assert.Equal(t, "testpass", cfg.Database.Password)
		assert.Equal(t, "testdb", cfg.Database.DBName)
		assert.Equal(t, "disable", cfg.Database.SSLMode)
	})

	t.Run("DatabaseConfig struct initialization", func(t *testing.T) {
		dbCfg := config.DatabaseConfig{
			Host:     "db.example.com",
			Port:     "5433",
			User:     "dbuser",
			Password: "dbpass",
			DBName:   "production_db",
			SSLMode:  "require",
		}

		assert.Equal(t, "db.example.com", dbCfg.Host)
		assert.Equal(t, "5433", dbCfg.Port)
		assert.Equal(t, "dbuser", dbCfg.User)
		assert.Equal(t, "dbpass", dbCfg.Password)
		assert.Equal(t, "production_db", dbCfg.DBName)
		assert.Equal(t, "require", dbCfg.SSLMode)
	})
}

// Benchmark tests for configuration loading
func BenchmarkConfigLoad(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = config.Load()
	}
}
