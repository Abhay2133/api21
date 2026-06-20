package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func RateLimiter(redisClient *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		// Rate limit endpoints starting with "/api/"
		if len(path) < 4 || path[:4] != "/api" {
			c.Next()
			return
		}

		ip := c.ClientIP()
		key := fmt.Sprintf("ratelimit:global:%s", ip)
		limit := int64(200)
		windowDuration := 15 * time.Minute

		allowed := true
		remaining := limit

		if redisClient != nil {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			current, err := redisClient.Incr(ctx, key).Result()
			if err != nil {
				log.Printf("[rate-limit] Redis error, failing open: %v", err)
			} else {
				if current == 1 {
					redisClient.Expire(ctx, key, windowDuration)
				}
				allowed = current <= limit
				if limit-current > 0 {
					remaining = limit - current
				} else {
					remaining = 0
				}
			}
		}

		c.Header("X-RateLimit-Limit", strconv.FormatInt(limit, 10))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(remaining, 10))

		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests, please slow down.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
