package tests

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"api21/internal/app"
	"api21/internal/config"

	"github.com/stretchr/testify/assert"
)

func TestGetUsers(t *testing.T) {
	// Setup
	cfg := config.Load()
	app := app.NewApp(cfg)

	// Create request
	req := httptest.NewRequest("GET", "/api/v1/users", nil)
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Check response body
	body, err := io.ReadAll(resp.Body)
	assert.NoError(t, err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	assert.NoError(t, err)
	assert.Equal(t, "Get all users", response["message"])
	assert.NotNil(t, response["data"])
}

func TestGetUser(t *testing.T) {
	// Setup
	cfg := config.Load()
	app := app.NewApp(cfg)

	// Test cases
	testCases := []struct {
		name           string
		userID         string
		expectedStatus int
		expectedInBody string
	}{
		{
			name:           "Valid user ID",
			userID:         "123",
			expectedStatus: 200,
			expectedInBody: "Get user by ID: 123",
		},
		{
			name:           "Another valid user ID",
			userID:         "456",
			expectedStatus: 200,
			expectedInBody: "Get user by ID: 456",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/users/"+tc.userID, nil)
			resp, err := app.Test(req)

			assert.NoError(t, err)
			assert.Equal(t, tc.expectedStatus, resp.StatusCode)

			body, err := io.ReadAll(resp.Body)
			assert.NoError(t, err)

			var response map[string]interface{}
			err = json.Unmarshal(body, &response)
			assert.NoError(t, err)
			assert.Equal(t, tc.expectedInBody, response["message"])
		})
	}
}

func TestCreateUser(t *testing.T) {
	// Setup
	cfg := config.Load()
	app := app.NewApp(cfg)

	// Test data
	userData := map[string]interface{}{
		"name":  "John Doe",
		"email": "john@example.com",
	}
	userJSON, _ := json.Marshal(userData)

	// Create request
	req := httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader(userJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 201, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(t, err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	assert.NoError(t, err)
	assert.Equal(t, "User created successfully", response["message"])
}

func TestUpdateUser(t *testing.T) {
	// Setup
	cfg := config.Load()
	app := app.NewApp(cfg)

	// Test data
	userData := map[string]interface{}{
		"name":  "John Updated",
		"email": "john.updated@example.com",
	}
	userJSON, _ := json.Marshal(userData)

	// Create request
	req := httptest.NewRequest("PUT", "/api/v1/users/123", bytes.NewReader(userJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(t, err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	assert.NoError(t, err)
	assert.Equal(t, "User updated successfully: 123", response["message"])
}

func TestDeleteUser(t *testing.T) {
	// Setup
	cfg := config.Load()
	app := app.NewApp(cfg)

	// Create request
	req := httptest.NewRequest("DELETE", "/api/v1/users/123", nil)
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(t, err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	assert.NoError(t, err)
	assert.Equal(t, "User deleted successfully: 123", response["message"])
}

func TestGetItems(t *testing.T) {
	// Setup
	cfg := config.Load()
	app := app.NewApp(cfg)

	// Test cases for pagination
	testCases := []struct {
		name        string
		queryParam  string
		expectPage  int
		expectLimit int
	}{
		{
			name:        "Default pagination",
			queryParam:  "",
			expectPage:  1,
			expectLimit: 10,
		},
		{
			name:        "Custom pagination",
			queryParam:  "?page=2&limit=5",
			expectPage:  2,
			expectLimit: 5,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/items"+tc.queryParam, nil)
			resp, err := app.Test(req)

			assert.NoError(t, err)
			assert.Equal(t, 200, resp.StatusCode)

			body, err := io.ReadAll(resp.Body)
			assert.NoError(t, err)

			var response map[string]interface{}
			err = json.Unmarshal(body, &response)
			assert.NoError(t, err)

			pagination, ok := response["pagination"].(map[string]interface{})
			assert.True(t, ok)
			assert.Equal(t, float64(tc.expectPage), pagination["page"])
			assert.Equal(t, float64(tc.expectLimit), pagination["limit"])
		})
	}
}

func TestGetItem(t *testing.T) {
	// Setup
	cfg := config.Load()
	app := app.NewApp(cfg)

	// Create request
	req := httptest.NewRequest("GET", "/api/v1/items/456", nil)
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(t, err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	assert.NoError(t, err)
	assert.Equal(t, "Get item by ID: 456", response["message"])
}

func TestCreateItem(t *testing.T) {
	// Setup
	cfg := config.Load()
	app := app.NewApp(cfg)

	// Test data
	itemData := map[string]interface{}{
		"title":       "Test Item",
		"description": "A test item",
		"price":       29.99,
	}
	itemJSON, _ := json.Marshal(itemData)

	// Create request
	req := httptest.NewRequest("POST", "/api/v1/items", bytes.NewReader(itemJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 201, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(t, err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	assert.NoError(t, err)
	assert.Equal(t, "Item created successfully", response["message"])
}

func TestUpdateItem(t *testing.T) {
	// Setup
	cfg := config.Load()
	app := app.NewApp(cfg)

	// Test data
	itemData := map[string]interface{}{
		"title":       "Updated Item",
		"description": "An updated test item",
		"price":       39.99,
	}
	itemJSON, _ := json.Marshal(itemData)

	// Create request
	req := httptest.NewRequest("PUT", "/api/v1/items/789", bytes.NewReader(itemJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(t, err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	assert.NoError(t, err)
	assert.Equal(t, "Item updated successfully: 789", response["message"])
}

func TestDeleteItem(t *testing.T) {
	// Setup
	cfg := config.Load()
	app := app.NewApp(cfg)

	// Create request
	req := httptest.NewRequest("DELETE", "/api/v1/items/789", nil)
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	assert.NoError(t, err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	assert.NoError(t, err)
	assert.Equal(t, "Item deleted successfully: 789", response["message"])
}
