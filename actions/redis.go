package actions

import (
	"context"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

// RedisClient is the shared redis connection client
var RedisClient *redis.Client

func init() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}
	
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("[redis] failed to parse url %s: %s", redisURL, err)
		// Fallback to default options
		opt = &redis.Options{
			Addr: "localhost:6379",
		}
	}

	RedisClient = redis.NewClient(opt)

	// Test connection in a background check
	go func() {
		ctx := context.Background()
		_, err := RedisClient.Ping(ctx).Result()
		if err != nil {
			log.Printf("[redis] warning: connection test failed: %s", err)
		} else {
			log.Printf("[redis] connected to %s", redisURL)
		}
	}()
}
