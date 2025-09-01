package tests

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"os"
	"testing"

	"api21/internal/app"
	"api21/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// IntegrationTestSuite contains integration tests for the entire API
type IntegrationTestSuite struct {
	suite.Suite
	app *fiber.App
}

// SetupSuite runs before all tests in the suite
func (suite *IntegrationTestSuite) SetupSuite() {
	// Set test environment variables
	os.Setenv("PORT", "3001")
	os.Setenv("APP_ENV", "test")

	// Load configuration
	cfg := config.Load()

	// Use the production app configuration
	suite.app = app.NewApp(cfg)
}

// TearDownSuite runs after all tests in the suite
func (suite *IntegrationTestSuite) TearDownSuite() {
	// Clean up environment variables
	os.Unsetenv("PORT")
	os.Unsetenv("APP_ENV")
}

// Test health endpoint
func (suite *IntegrationTestSuite) TestHealthEndpoint() {
	req := httptest.NewRequest("GET", "/health", nil)
	resp, err := suite.app.Test(req)

	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(suite.T(), err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "ok", response["status"])
	assert.Equal(suite.T(), "API21 is running", response["message"])
}

// Test root endpoint
func (suite *IntegrationTestSuite) TestRootEndpoint() {
	req := httptest.NewRequest("GET", "/", nil)
	resp, err := suite.app.Test(req)

	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(suite.T(), err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "ok", response["status"])
	assert.Equal(suite.T(), "API21", response["service"])
	assert.Equal(suite.T(), "v1.0.0", response["version"])
}

// Test CORS middleware
func (suite *IntegrationTestSuite) TestCORSMiddleware() {
	req := httptest.NewRequest("OPTIONS", "/api/v1/users", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")

	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)

	// Check CORS headers
	assert.NotEmpty(suite.T(), resp.Header.Get("Access-Control-Allow-Origin"))
}

// Test full user workflow
func (suite *IntegrationTestSuite) TestUserWorkflow() {
	// Test GET all users
	req := httptest.NewRequest("GET", "/api/v1/users", nil)
	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	// Test POST create user
	userData := map[string]interface{}{
		"name":  "Integration Test User",
		"email": "integration@test.com",
	}
	userJSON, _ := json.Marshal(userData)

	req = httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader(userJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 201, resp.StatusCode)

	// Test GET specific user
	req = httptest.NewRequest("GET", "/api/v1/users/123", nil)
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	// Test PUT update user
	updateData := map[string]interface{}{
		"name": "Updated Integration User",
	}
	updateJSON, _ := json.Marshal(updateData)

	req = httptest.NewRequest("PUT", "/api/v1/users/123", bytes.NewReader(updateJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	// Test DELETE user
	req = httptest.NewRequest("DELETE", "/api/v1/users/123", nil)
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)
}

// Test full item workflow
func (suite *IntegrationTestSuite) TestItemWorkflow() {
	// Test GET all items with pagination
	req := httptest.NewRequest("GET", "/api/v1/items?page=1&limit=5", nil)
	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(suite.T(), err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	assert.NoError(suite.T(), err)

	pagination, ok := response["pagination"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), float64(1), pagination["page"])
	assert.Equal(suite.T(), float64(5), pagination["limit"])

	// Test POST create item
	itemData := map[string]interface{}{
		"title":       "Integration Test Item",
		"description": "An item created during integration testing",
		"price":       99.99,
	}
	itemJSON, _ := json.Marshal(itemData)

	req = httptest.NewRequest("POST", "/api/v1/items", bytes.NewReader(itemJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 201, resp.StatusCode)

	// Test GET specific item
	req = httptest.NewRequest("GET", "/api/v1/items/456", nil)
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	// Test PUT update item
	updateData := map[string]interface{}{
		"title": "Updated Integration Item",
		"price": 149.99,
	}
	updateJSON, _ := json.Marshal(updateData)

	req = httptest.NewRequest("PUT", "/api/v1/items/456", bytes.NewReader(updateJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	// Test DELETE item
	req = httptest.NewRequest("DELETE", "/api/v1/items/456", nil)
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)
}

// Test error handling
func (suite *IntegrationTestSuite) TestErrorHandling() {
	// Test 404 for non-existent routes
	req := httptest.NewRequest("GET", "/api/v1/nonexistent", nil)
	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 404, resp.StatusCode)

	// Test 405 for unsupported methods
	req = httptest.NewRequest("PATCH", "/api/v1/users/123", nil)
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 405, resp.StatusCode)
}

// Test content type handling
func (suite *IntegrationTestSuite) TestContentTypeHandling() {
	// Test POST without Content-Type header
	userData := `{"name": "Test User"}`
	req := httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader([]byte(userData)))
	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	// Should still work as handlers don't strictly require Content-Type
	assert.Equal(suite.T(), 201, resp.StatusCode)

	// Test POST with correct Content-Type
	req = httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader([]byte(userData)))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 201, resp.StatusCode)
}

// Test concurrent requests
func (suite *IntegrationTestSuite) TestConcurrentRequests() {
	const numRequests = 10
	results := make(chan error, numRequests)

	// Send multiple concurrent requests
	for i := 0; i < numRequests; i++ {
		go func() {
			req := httptest.NewRequest("GET", "/health", nil)
			resp, err := suite.app.Test(req)
			if err != nil {
				results <- err
				return
			}
			if resp.StatusCode != 200 {
				results <- assert.AnError
				return
			}
			results <- nil
		}()
	}

	// Collect results
	for i := 0; i < numRequests; i++ {
		err := <-results
		assert.NoError(suite.T(), err)
	}
}

// Test API versioning
func (suite *IntegrationTestSuite) TestAPIVersioning() {
	// Test that routes are properly versioned under /api/v1
	req := httptest.NewRequest("GET", "/api/v1/users", nil)
	resp, err := suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 200, resp.StatusCode)

	// Test that unversioned routes don't exist
	req = httptest.NewRequest("GET", "/users", nil)
	resp, err = suite.app.Test(req)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 404, resp.StatusCode)
}

// Run the integration test suite
func TestIntegrationSuite(t *testing.T) {
	suite.Run(t, new(IntegrationTestSuite))
}
