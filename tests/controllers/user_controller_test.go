package controllers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"api21/src/controllers"
	"api21/tests/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// UserControllerTestSuite defines the test suite for UserController
type UserControllerTestSuite struct {
	suite.Suite
	app *fiber.App
	controller *controllers.UserController
}

// SetupSuite runs once before all tests
func (suite *UserControllerTestSuite) SetupSuite() {
	// Setup test database
	utils.SetupTestDB(suite.T())
	
	// Create Fiber app
	suite.app = fiber.New()
	suite.controller = controllers.NewUserController()
	
	// Setup routes
	api := suite.app.Group("/api")
	users := api.Group("/users")
	users.Get("/", suite.controller.GetUsers)
	users.Get("/:id", suite.controller.GetUser)
	users.Post("/", suite.controller.CreateUser)
	users.Put("/:id", suite.controller.UpdateUser)
	users.Delete("/:id", suite.controller.DeleteUser)
}

// TearDownSuite runs once after all tests
func (suite *UserControllerTestSuite) TearDownSuite() {
	utils.CleanupTestDB(suite.T())
}

// SetupTest runs before each test
func (suite *UserControllerTestSuite) SetupTest() {
	utils.TruncateTables(suite.T())
}

func (suite *UserControllerTestSuite) TestGetUsers_Empty() {
	req := httptest.NewRequest("GET", "/api/users/", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	assert.Equal(suite.T(), "Users retrieved successfully", response["message"])
	assert.Equal(suite.T(), float64(0), response["count"])
	assert.Empty(suite.T(), response["data"])
}

func (suite *UserControllerTestSuite) TestGetUsers_WithData() {
	// Create test users
	utils.CreateTestUser("User1", "user1@example.com")
	utils.CreateTestUser("User2", "user2@example.com")
	
	req := httptest.NewRequest("GET", "/api/users/", nil)
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

func (suite *UserControllerTestSuite) TestGetUser_Success() {
	// Create test user
	user := utils.CreateTestUser("Test User", "test@example.com")
	
	req := httptest.NewRequest("GET", "/api/users/"+strconv.Itoa(int(user.ID)), nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.Equal(suite.T(), "Test User", data["name"])
	assert.Equal(suite.T(), "test@example.com", data["email"])
}

func (suite *UserControllerTestSuite) TestGetUser_NotFound() {
	req := httptest.NewRequest("GET", "/api/users/999", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusNotFound, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.False(suite.T(), response["success"].(bool))
	assert.Equal(suite.T(), "User not found", response["message"])
}

func (suite *UserControllerTestSuite) TestGetUser_InvalidID() {
	req := httptest.NewRequest("GET", "/api/users/invalid", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusBadRequest, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.False(suite.T(), response["success"].(bool))
}

func (suite *UserControllerTestSuite) TestCreateUser_Success() {
	userData := map[string]string{
		"name":  "New User",
		"email": "new@example.com",
	}
	
	jsonData, _ := json.Marshal(userData)
	req := httptest.NewRequest("POST", "/api/users/", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusCreated, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	assert.Equal(suite.T(), "User created successfully", response["message"])
	
	data := response["data"].(map[string]interface{})
	assert.Equal(suite.T(), "New User", data["name"])
	assert.Equal(suite.T(), "new@example.com", data["email"])
	assert.NotZero(suite.T(), data["id"])
}

func (suite *UserControllerTestSuite) TestCreateUser_MissingFields() {
	userData := map[string]string{
		"name": "Incomplete User",
		// Missing email
	}
	
	jsonData, _ := json.Marshal(userData)
	req := httptest.NewRequest("POST", "/api/users/", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusBadRequest, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.False(suite.T(), response["success"].(bool))
}

func (suite *UserControllerTestSuite) TestCreateUser_DuplicateEmail() {
	// Create first user
	utils.CreateTestUser("First User", "duplicate@example.com")
	
	// Try to create second user with same email
	userData := map[string]string{
		"name":  "Second User",
		"email": "duplicate@example.com",
	}
	
	jsonData, _ := json.Marshal(userData)
	req := httptest.NewRequest("POST", "/api/users/", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusInternalServerError, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.False(suite.T(), response["success"].(bool))
}

func (suite *UserControllerTestSuite) TestUpdateUser_Success() {
	// Create test user
	user := utils.CreateTestUser("Original Name", "original@example.com")
	
	updateData := map[string]string{
		"name":  "Updated Name",
		"email": "updated@example.com",
	}
	
	jsonData, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/users/"+strconv.Itoa(int(user.ID)), bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.Equal(suite.T(), "Updated Name", data["name"])
	assert.Equal(suite.T(), "updated@example.com", data["email"])
}

func (suite *UserControllerTestSuite) TestUpdateUser_NotFound() {
	updateData := map[string]string{
		"name":  "Updated Name",
		"email": "updated@example.com",
	}
	
	jsonData, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/users/999", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusNotFound, resp.StatusCode)
}

func (suite *UserControllerTestSuite) TestDeleteUser_Success() {
	// Create test user
	user := utils.CreateTestUser("To Delete", "delete@example.com")
	
	req := httptest.NewRequest("DELETE", "/api/users/"+strconv.Itoa(int(user.ID)), nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(suite.T(), err)
	
	assert.True(suite.T(), response["success"].(bool))
	assert.Equal(suite.T(), "User deleted successfully", response["message"])
}

func (suite *UserControllerTestSuite) TestDeleteUser_NotFound() {
	req := httptest.NewRequest("DELETE", "/api/users/999", nil)
	resp, err := suite.app.Test(req)
	
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), http.StatusNotFound, resp.StatusCode)
}

// TestUserController runs the test suite
func TestUserController(t *testing.T) {
	suite.Run(t, new(UserControllerTestSuite))
}