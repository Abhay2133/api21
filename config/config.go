package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"sync"

	"github.com/joho/godotenv"
)

type Config struct {
	sync.RWMutex
	Env                string
	Port               int
	DatabaseURL        string
	RedisURL           string
	PingURL            string
	AllowedAdminOrigin string
	MasterCredentials  map[string]string
}

var AppConfig *Config

func Load() {
	if err := godotenv.Load(); err != nil {
		log.Println("[config] info: no .env file found, relying on system environment variables")
	}

	AppConfig = &Config{}
	AppConfig.ReloadDynamicConfig()
}

// ReloadDynamicConfig re-reads the environment and safely updates the configuration
func (c *Config) ReloadDynamicConfig() {
	c.Lock()
	defer c.Unlock()

	// It's possible to call godotenv.Load() again here if we want to ensure .env is fresh
	// However, if we mutate the file and want it reflected, godotenv.Read() is better, 
	// but os.LookupEnv reads process env vars. For true dynamic config from file without
	// restarting, we should parse the file.
	envMap, err := godotenv.Read()
	if err != nil {
		log.Println("[config] info: could not read .env file for dynamic reload, falling back to os env")
	}

	// Helper to prioritize .env file (if it changed on disk) over process env vars
	getDynamicEnv := func(key, fallback string) string {
		if envMap != nil {
			if val, ok := envMap[key]; ok {
				return val
			}
		}
		if value, exists := os.LookupEnv(key); exists {
			return value
		}
		return fallback
	}

	c.Env = getDynamicEnv("GO_ENV", "development")
	
	portStr := getDynamicEnv("PORT", "3000")
	if port, err := strconv.Atoi(portStr); err == nil {
		c.Port = port
	} else {
		c.Port = 3000
	}

	c.DatabaseURL = getDynamicEnv("DATABASE_URL", "postgres://postgres:postgres@127.0.0.1:5432/api21?sslmode=disable")
	c.RedisURL = getDynamicEnv("REDIS_URL", "redis://localhost:6379/0")
	c.PingURL = getDynamicEnv("PING_URL", "")
	c.AllowedAdminOrigin = getDynamicEnv("ADMIN_ORIGIN", "https://admin.abhaybisht.com")

	// Parse Master Credentials: user1:pass1;user2:pass2
	credStr := getDynamicEnv("MASTER_CREDENTIALS", "")
	c.MasterCredentials = make(map[string]string)
	
	if credStr != "" {
		pairs := strings.Split(credStr, ";")
		for _, pair := range pairs {
			parts := strings.SplitN(pair, ":", 2)
			if len(parts) == 2 {
				c.MasterCredentials[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
			}
		}
	}

	log.Printf("[config] loaded/reloaded configuration for env: %s, port: %d", c.Env, c.Port)
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
