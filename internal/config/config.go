package config

import "os"

type Config struct {
	Port     string
	Database DatabaseConfig
	CronJobs CronJobsConfig
}

type DatabaseConfig struct {
	Driver   string // "sqlite" or "postgres"
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type CronJobsConfig struct {
	PingURL      string
	PingSchedule string
}

func Load() *Config {
	return &Config{
		Port: getEnv("PORT", "3000"),
		Database: DatabaseConfig{
			Driver:   getEnv("DB_DRIVER", "sqlite"),
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "api21_db"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		CronJobs: CronJobsConfig{
			PingURL:      getEnv("PING_URL", ""),
			PingSchedule: getEnv("PING_SCHEDULE", "*/5 * * * *"), // Default: every 5 minutes
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
