package tests

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http/httptest"
	"testing"

	"api21/internal/app"
	"api21/internal/config"

	"github.com/stretchr/testify/assert"
)

func TestSetupRoutes(t *testing.T) {
	// Setup
	cfg := config.Load()
	testApp := app.NewApp(cfg)

	t.Run("Test Users Routes", func(t *testing.T) {
		// Test GET /api/v1/users
		req := httptest.NewRequest("GET", "/api/v1/users", nil)
		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		// Test GET /api/v1/users/:id
		req = httptest.NewRequest("GET", "/api/v1/users/123", nil)
		resp, err = testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		// Test POST /api/v1/users
		req = httptest.NewRequest("POST", "/api/v1/users", nil)
		req.Header.Set("Content-Type", "application/json")
		resp, err = testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode)

		// Test PUT /api/v1/users/:id
		req = httptest.NewRequest("PUT", "/api/v1/users/123", nil)
		req.Header.Set("Content-Type", "application/json")
		resp, err = testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		// Test DELETE /api/v1/users/:id
		req = httptest.NewRequest("DELETE", "/api/v1/users/123", nil)
		resp, err = testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("Test Items Routes", func(t *testing.T) {
		// Test GET /api/v1/items
		req := httptest.NewRequest("GET", "/api/v1/items", nil)
		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		// Test GET /api/v1/items/:id
		req = httptest.NewRequest("GET", "/api/v1/items/456", nil)
		resp, err = testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		// Test POST /api/v1/items
		req = httptest.NewRequest("POST", "/api/v1/items", nil)
		req.Header.Set("Content-Type", "application/json")
		resp, err = testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode)

		// Test PUT /api/v1/items/:id
		req = httptest.NewRequest("PUT", "/api/v1/items/456", nil)
		req.Header.Set("Content-Type", "application/json")
		resp, err = testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		// Test DELETE /api/v1/items/:id
		req = httptest.NewRequest("DELETE", "/api/v1/items/456", nil)
		resp, err = testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("Test Route Groups", func(t *testing.T) {
		// Test that routes are properly grouped under /api/v1

		// This should NOT exist (no /users, only /api/v1/users)
		req := httptest.NewRequest("GET", "/users", nil)
		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 404, resp.StatusCode)

		// This should NOT exist (no /items, only /api/v1/items)
		req = httptest.NewRequest("GET", "/items", nil)
		resp, err = testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 404, resp.StatusCode)
	})
}

func TestRouteParameterExtraction(t *testing.T) {
	// Setup
	cfg := config.Load()
	testApp := app.NewApp(cfg)

	t.Run("User ID parameter extraction", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/users/test-user-id", nil)
		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		body, err := io.ReadAll(resp.Body)
		assert.NoError(t, err)

		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		assert.NoError(t, err)
		assert.Contains(t, response["message"], "test-user-id")
	})

	t.Run("Item ID parameter extraction", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/items/test-item-id", nil)
		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		body, err := io.ReadAll(resp.Body)
		assert.NoError(t, err)

		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		assert.NoError(t, err)
		assert.Contains(t, response["message"], "test-item-id")
	})
}

func TestRouteMethodValidation(t *testing.T) {
	// Setup
	cfg := config.Load()
	testApp := app.NewApp(cfg)

	t.Run("Invalid HTTP methods should return 405", func(t *testing.T) {
		// PATCH is not supported for users
		req := httptest.NewRequest("PATCH", "/api/v1/users/123", nil)
		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 405, resp.StatusCode)

		// OPTIONS should work due to CORS
		req = httptest.NewRequest("OPTIONS", "/api/v1/users", nil)
		resp, err = testApp.Test(req)
		assert.NoError(t, err)
		// Should not be 405, might be 200 or 204 depending on CORS setup
		assert.NotEqual(t, 405, resp.StatusCode)
		fmt.Println("OPTIONS /api/v1/users status:", resp.StatusCode)
	})
}

// Test that routes are using correct handlers
func TestRouteHandlerMapping(t *testing.T) {
	// Create a test app with a spy handler to verify which handler is called
	cfg := config.Load()
	testApp := app.NewApp(cfg)

	// We can't directly test which handler function is called,
	// but we can test the expected behavior

	testCases := []struct {
		method   string
		path     string
		expected int
	}{
		{"GET", "/api/v1/users", 200},
		{"POST", "/api/v1/users", 201},
		{"GET", "/api/v1/users/123", 200},
		{"PUT", "/api/v1/users/123", 200},
		{"DELETE", "/api/v1/users/123", 200},
		{"GET", "/api/v1/items", 200},
		{"POST", "/api/v1/items", 201},
		{"GET", "/api/v1/items/456", 200},
		{"PUT", "/api/v1/items/456", 200},
		{"DELETE", "/api/v1/items/456", 200},
	}

	for _, tc := range testCases {
		t.Run(tc.method+" "+tc.path, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, nil)
			if tc.method == "POST" || tc.method == "PUT" {
				req.Header.Set("Content-Type", "application/json")
			}
			resp, err := testApp.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tc.expected, resp.StatusCode)
		})
	}
}

// Benchmark route performance
func BenchmarkUserRoutes(b *testing.B) {
	cfg := config.Load()
	app := app.NewApp(cfg)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest("GET", "/api/v1/users", nil)
		_, _ = app.Test(req)
	}
}

func BenchmarkItemRoutes(b *testing.B) {
	cfg := config.Load()
	app := app.NewApp(cfg)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest("GET", "/api/v1/items", nil)
		_, _ = app.Test(req)
	}
}
