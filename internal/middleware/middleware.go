package middleware

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

// AuthMiddleware is a placeholder for authentication middleware
func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// TODO: Implement JWT or other authentication logic
		// For now, just pass through
		return c.Next()
	}
}

// RateLimitMiddleware implements basic rate limiting
func RateLimitMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// TODO: Implement rate limiting logic
		// For now, just pass through
		return c.Next()
	}
}

// RequestIDMiddleware adds a unique request ID to each request
func RequestIDMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Generate a simple request ID using timestamp
		requestID := time.Now().UnixNano()
		c.Locals("requestID", requestID)
		c.Set("X-Request-ID", strconv.FormatInt(requestID, 10))
		return c.Next()
	}
}

// ValidateAPIKey middleware for API key validation
func ValidateAPIKey() fiber.Handler {
	return func(c *fiber.Ctx) error {
		apiKey := c.Get("X-API-Key")
		if apiKey == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "API key is required",
			})
		}

		// TODO: Validate API key against database or environment
		// For now, just check if it's not empty

		return c.Next()
	}
}
