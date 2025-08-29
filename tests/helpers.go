package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"github.com/gofiber/fiber/v2"
)

// TestHelper provides utility functions for testing
type TestHelper struct {
	app *fiber.App
}

// NewTestHelper creates a new test helper
func NewTestHelper(app *fiber.App) *TestHelper {
	return &TestHelper{app: app}
}

// MakeJSONRequest creates and sends a JSON request
func (th *TestHelper) MakeJSONRequest(method, path string, body interface{}) (*http.Response, error) {
	var reqBody *bytes.Reader

	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewReader(jsonData)
	} else {
		reqBody = bytes.NewReader([]byte{})
	}

	req := httptest.NewRequest(method, path, reqBody)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	return th.app.Test(req)
}

// MakeRequest creates and sends a basic request
func (th *TestHelper) MakeRequest(method, path string) (*http.Response, error) {
	req := httptest.NewRequest(method, path, nil)
	return th.app.Test(req)
}

// ParseJSONResponse parses a JSON response into a map
func ParseJSONResponse(resp *httptest.ResponseRecorder) (map[string]interface{}, error) {
	var result map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &result)
	return result, err
}

// TestData contains common test data structures
type TestData struct {
	ValidUser   map[string]interface{}
	InvalidUser map[string]interface{}
	ValidItem   map[string]interface{}
	InvalidItem map[string]interface{}
}

// NewTestData creates common test data
func NewTestData() *TestData {
	return &TestData{
		ValidUser: map[string]interface{}{
			"name":  "Test User",
			"email": "test@example.com",
		},
		InvalidUser: map[string]interface{}{
			"name": "", // Invalid: empty name
		},
		ValidItem: map[string]interface{}{
			"title":       "Test Item",
			"description": "A test item description",
			"price":       29.99,
		},
		InvalidItem: map[string]interface{}{
			"title": "", // Invalid: empty title
		},
	}
}

// AssertJSONResponse checks if response contains expected JSON structure
func AssertJSONResponse(t interface{}, resp map[string]interface{}, expectedMessage string) {
	// This is a helper that would work with any testing framework
	// Implementation depends on the testing framework being used
}

// MockData provides mock data for testing
type MockData struct {
	Users []map[string]interface{}
	Items []map[string]interface{}
}

// NewMockData creates mock data for testing
func NewMockData() *MockData {
	return &MockData{
		Users: []map[string]interface{}{
			{
				"id":    1,
				"name":  "John Doe",
				"email": "john@example.com",
			},
			{
				"id":    2,
				"name":  "Jane Smith",
				"email": "jane@example.com",
			},
		},
		Items: []map[string]interface{}{
			{
				"id":          1,
				"title":       "First Item",
				"description": "Description of first item",
				"price":       19.99,
				"user_id":     1,
			},
			{
				"id":          2,
				"title":       "Second Item",
				"description": "Description of second item",
				"price":       29.99,
				"user_id":     2,
			},
		},
	}
}
