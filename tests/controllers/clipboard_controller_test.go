package controllers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"api21/src/cache"
	"api21/src/controllers"
	"api21/tests/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// ClipboardControllerTestSuite defines the test suite for ClipboardController
type ClipboardControllerTestSuite struct {
	suite.Suite
	app *fiber.App
	controller *controllers.ClipboardController
}

// SetupSuite runs once before all tests
func (suite *ClipboardControllerTestSuite) SetupSuite() {
	// Setup test database
	utils.SetupTestDB(suite.T())
	
	// Create Fiber app
	suite.app = fiber.New()
	suite.controller = controllers.NewClipboardController()
	
	// Setup routes
	api := suite.app.Group("/api")
	clipboard := api.Group("/clipboard")
	clipboard.Get("/", suite.controller.GetClipboards)
	clipboard.Get("/:id", suite.controller.GetClipboard)
	clipboard.Post("/", suite.controller.CreateClipboard)
	clipboard.Put("/:id", suite.controller.UpdateClipboard)
	clipboard.Delete("/:id", suite.controller.DeleteClipboard)
}

// TearDownSuite runs once after all tests
func (suite *ClipboardControllerTestSuite) TearDownSuite() {
	utils.CleanupTestDB(suite.T())
}

// SetupTest runs before each test
func (suite *ClipboardControllerTestSuite) SetupTest() {
	utils.TruncateTables(suite.T())
	// Clear cache to ensure fresh state for each test
	cache.GetManager().ClearAll()
}

func (suite *ClipboardControllerTestSuite) TestGetClipboards_Empty() {
	req := httptest.NewRequest("GET", "/api/clipboard/", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	assert.Equal(suite.T(), "Clipboard entries retrieved successfully", response["message"])
	assert.Equal(suite.T(), float64(0), response["count"])
	assert.Empty(suite.T(), response["data"])
}

func (suite *ClipboardControllerTestSuite) TestGetClipboards_WithData() {
	// Create test clipboards
	utils.CreateTestClipboard("snippet1", "console.log('test1');")
	utils.CreateTestClipboard("snippet2", "console.log('test2');")
	
	req := httptest.NewRequest("GET", "/api/clipboard/", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	assert.Equal(suite.T(), float64(2), response["count"])
	
	data := response["data"].([]interface{})
	assert.Len(suite.T(), data, 2)
}

func (suite *ClipboardControllerTestSuite) TestGetClipboard_Success() {
	// Create test clipboard
	clipboard := utils.CreateTestClipboard("test_snippet", "console.log('hello world');")
	
	req := httptest.NewRequest("GET", "/api/clipboard/"+strconv.Itoa(int(clipboard.ID)), nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.Equal(suite.T(), "test_snippet", data["title"])
	assert.Equal(suite.T(), "console.log('hello world');", data["content"])
}

func (suite *ClipboardControllerTestSuite) TestGetClipboard_NotFound() {
	req := httptest.NewRequest("GET", "/api/clipboard/999", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusNotFound, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.False(suite.T(), response["success"].(bool))
	assert.Equal(suite.T(), "Clipboard entry not found", response["message"])
}

func (suite *ClipboardControllerTestSuite) TestCreateClipboard_WithTitle() {
	clipboardData := map[string]string{
		"title":   "my_snippet",
		"content": "console.log('Hello!');",
	}
	
	jsonData, _ := json.Marshal(clipboardData)
	req := httptest.NewRequest("POST", "/api/clipboard/", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusCreated, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	assert.Equal(suite.T(), "Clipboard entry created successfully", response["message"])
	
	data := response["data"].(map[string]interface{})
	assert.Equal(suite.T(), "my_snippet", data["title"])
	assert.Equal(suite.T(), "console.log('Hello!');", data["content"])
	assert.NotZero(suite.T(), data["id"])
}

func (suite *ClipboardControllerTestSuite) TestCreateClipboard_WithoutTitle() {
	clipboardData := map[string]string{
		"content": "This should get a random ID",
	}
	
	jsonData, _ := json.Marshal(clipboardData)
	req := httptest.NewRequest("POST", "/api/clipboard/", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusCreated, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	
	data := response["data"].(map[string]interface{})
	assert.NotEmpty(suite.T(), data["title"]) // Should have a generated title
	assert.Len(suite.T(), data["title"].(string), 8) // Should be 8 characters
	assert.Equal(suite.T(), "This should get a random ID", data["content"])
}

func (suite *ClipboardControllerTestSuite) TestCreateClipboard_MissingContent() {
	clipboardData := map[string]string{
		"title": "incomplete_snippet",
		// Missing content
	}
	
	jsonData, _ := json.Marshal(clipboardData)
	req := httptest.NewRequest("POST", "/api/clipboard/", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusBadRequest, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.False(suite.T(), response["success"].(bool))
}

func (suite *ClipboardControllerTestSuite) TestUpdateClipboard_Success() {
	// Create test clipboard
	clipboard := utils.CreateTestClipboard("original_title", "original content")
	
	updateData := map[string]string{
		"title":   "updated_title",
		"content": "updated content",
	}
	
	jsonData, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/clipboard/"+strconv.Itoa(int(clipboard.ID)), bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.Equal(suite.T(), "updated_title", data["title"])
	assert.Equal(suite.T(), "updated content", data["content"])
}

func (suite *ClipboardControllerTestSuite) TestUpdateClipboard_NotFound() {
	updateData := map[string]string{
		"title":   "updated_title",
		"content": "updated content",
	}
	
	jsonData, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/clipboard/999", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusNotFound, resp.StatusCode)
}

func (suite *ClipboardControllerTestSuite) TestDeleteClipboard_Success() {
	// Create test clipboard
	clipboard := utils.CreateTestClipboard("to_delete", "content to delete")
	
	req := httptest.NewRequest("DELETE", "/api/clipboard/"+strconv.Itoa(int(clipboard.ID)), nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	assert.Equal(suite.T(), "Clipboard entry deleted successfully", response["message"])
}

func (suite *ClipboardControllerTestSuite) TestDeleteClipboard_NotFound() {
	req := httptest.NewRequest("DELETE", "/api/clipboard/999", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusNotFound, resp.StatusCode)
}

// TestClipboardController runs the test suite
func TestClipboardController(t *testing.T) {
	suite.Run(t, new(ClipboardControllerTestSuite))
}