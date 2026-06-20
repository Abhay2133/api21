package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Env         string
	Port        int
	DatabaseURL string
	RedisURL    string
	PingURL     string
}

var AppConfig *Config

func Load() {
	// Try to load .env file if it exists, but don't fail if it doesn't
	if err := godotenv.Load(); err != nil {
		log.Println("[config] info: no .env file found, relying on system environment variables")
	}

	env := getEnv("GO_ENV", "development")
	portStr := getEnv("PORT", "3000")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		port = 3000
	}

	dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@127.0.0.1:5432/api21?sslmode=disable")
	redisURL := getEnv("REDIS_URL", "redis://localhost:6379/0")
	pingURL := getEnv("PING_URL", "")

	AppConfig = &Config{
		Env:         env,
		Port:        port,
		DatabaseURL: dbURL,
		RedisURL:    redisURL,
		PingURL:     pingURL,
	}

	log.Printf("[config] loaded configuration for env: %s, port: %d", AppConfig.Env, AppConfig.Port)
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
