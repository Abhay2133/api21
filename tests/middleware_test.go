package tests

import (
	"net/http/httptest"
	"testing"

	"api21/internal/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestAuthMiddleware(t *testing.T) {
	// Setup
	app := fiber.New()

	// Add middleware
	app.Use("/protected", middleware.AuthMiddleware())
	app.Get("/protected/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Protected route accessed"})
	})

	t.Run("Should allow access (placeholder implementation)", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/protected/test", nil)
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})
}

func TestRateLimitMiddleware(t *testing.T) {
	// Setup
	app := fiber.New()

	// Add middleware
	app.Use("/api", middleware.RateLimitMiddleware())
	app.Get("/api/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "API route accessed"})
	})

	t.Run("Should allow access (placeholder implementation)", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/test", nil)
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})
}

func TestRequestIDMiddleware(t *testing.T) {
	// Setup
	app := fiber.New()

	// Add middleware
	app.Use(middleware.RequestIDMiddleware())
	app.Get("/test", func(c *fiber.Ctx) error {
		requestID := c.Locals("requestID")
		return c.JSON(fiber.Map{
			"message":   "Request processed",
			"requestID": requestID,
		})
	})

	t.Run("Should add request ID to locals", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/test", nil)
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		// Check if X-Request-ID header is set
		requestIDHeader := resp.Header.Get("X-Request-ID")
		assert.NotEmpty(t, requestIDHeader)
	})

	t.Run("Should generate different request IDs", func(t *testing.T) {
		req1 := httptest.NewRequest("GET", "/test", nil)
		resp1, err1 := app.Test(req1)
		assert.NoError(t, err1)

		req2 := httptest.NewRequest("GET", "/test", nil)
		resp2, err2 := app.Test(req2)
		assert.NoError(t, err2)

		requestID1 := resp1.Header.Get("X-Request-ID")
		requestID2 := resp2.Header.Get("X-Request-ID")

		assert.NotEqual(t, requestID1, requestID2)
	})
}

func TestValidateAPIKey(t *testing.T) {
	// Setup
	app := fiber.New()

	// Add middleware
	app.Use("/api", middleware.ValidateAPIKey())
	app.Get("/api/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "API key validated"})
	})

	t.Run("Should reject request without API key", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/test", nil)
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 401, resp.StatusCode)
	})

	t.Run("Should accept request with API key", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/test", nil)
		req.Header.Set("X-API-Key", "test-api-key")
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("Should reject request with empty API key", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/test", nil)
		req.Header.Set("X-API-Key", "")
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 401, resp.StatusCode)
	})
}

// Test middleware chaining
func TestMiddlewareChaining(t *testing.T) {
	// Setup
	app := fiber.New()

	// Add multiple middleware
	app.Use("/api", middleware.RequestIDMiddleware(), middleware.ValidateAPIKey())
	app.Get("/api/test", func(c *fiber.Ctx) error {
		requestID := c.Locals("requestID")
		return c.JSON(fiber.Map{
			"message":   "Multiple middleware applied",
			"requestID": requestID,
		})
	})

	t.Run("Should apply all middleware in order", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/test", nil)
		req.Header.Set("X-API-Key", "valid-key")
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		// Check that request ID is set
		requestIDHeader := resp.Header.Get("X-Request-ID")
		assert.NotEmpty(t, requestIDHeader)
	})

	t.Run("Should stop at API key validation if key is missing", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/test", nil)
		// No API key set
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 401, resp.StatusCode)

		// Request ID should still be set (middleware runs before API key validation)
		requestIDHeader := resp.Header.Get("X-Request-ID")
		assert.NotEmpty(t, requestIDHeader)
	})
}

// Performance tests
func BenchmarkRequestIDMiddleware(b *testing.B) {
	app := fiber.New()
	app.Use(middleware.RequestIDMiddleware())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendStatus(200)
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		_, _ = app.Test(req)
	}
}

func BenchmarkValidateAPIKey(b *testing.B) {
	app := fiber.New()
	app.Use(middleware.ValidateAPIKey())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendStatus(200)
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		req.Header.Set("X-API-Key", "test-key")
		_, _ = app.Test(req)
	}
}
