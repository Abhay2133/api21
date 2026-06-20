package redis

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

func NewRedisConnection(redisURL string) (*redis.Client, error) {
	log.Printf("[redis] connecting to Redis at: %s", redisURL)

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("[redis] warning: failed to parse Redis URL %s: %v, falling back to localhost", redisURL, err)
		opt = &redis.Options{
			Addr: "localhost:6379",
		}
	}

	client := redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if _, err := client.Ping(ctx).Result(); err != nil {
		return nil, err
	}

	log.Println("[redis] connection to Redis verified successfully.")
	return client, nil
}
