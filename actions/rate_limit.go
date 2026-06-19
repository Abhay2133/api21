package actions

import (
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiterMiddleware limits requests to API endpoints to 200 req / 15 min using Redis
func RateLimiterMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		req := c.Request
		url := req.URL.Path

		// Only rate-limit API routes
		if !strings.HasPrefix(url, "/api/") {
			c.Next()
			return
		}

		// Get IP address
		ip := c.GetHeader("X-Forwarded-For")
		if ip != "" {
			ip = strings.Split(ip, ",")[0]
			ip = strings.TrimSpace(ip)
		} else {
			var err error
			ip, _, err = net.SplitHostPort(req.RemoteAddr)
			if err != nil {
				ip = req.RemoteAddr
			}
		}

		key := "ratelimit:global:" + ip
		limit := int64(200)
		window := 15 * time.Minute

		allowed := true
		remaining := limit

		if RedisClient != nil {
			ctx := req.Context()
			current, err := RedisClient.Incr(ctx, key).Result()
			if err == nil {
				if current == 1 {
					RedisClient.Expire(ctx, key, window)
				}
				allowed = current <= limit
				if limit-current > 0 {
					remaining = limit - current
				} else {
					remaining = 0
				}
			} else {
				log.Printf("[rate-limit] Redis error, failing open: %s", err)
			}
		}

		// Set rate-limit headers
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
