package actions

import (
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gobuffalo/buffalo"
)

// RateLimiterMiddleware limits requests to API endpoints to 200 req / 15 min using Redis
func RateLimiterMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		req := c.Request()
		url := req.URL.Path

		// Only rate-limit API routes
		if !strings.HasPrefix(url, "/api/") {
			return next(c)
		}

		// Get IP address
		ip := req.Header.Get("X-Forwarded-For")
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

		ctx := req.Context()
		allowed := true
		remaining := limit

		if RedisClient != nil {
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
		res := c.Response()
		res.Header().Set("X-RateLimit-Limit", strconv.FormatInt(limit, 10))
		res.Header().Set("X-RateLimit-Remaining", strconv.FormatInt(remaining, 10))

		if !allowed {
			return c.Render(http.StatusTooManyRequests, r.JSON(map[string]string{
				"error": "Too many requests, please slow down.",
			}))
		}

		return next(c)
	}
}
