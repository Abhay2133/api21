package models

import (
	"testing"

	"api21/src/models"
	"api21/tests/utils"

	"github.com/stretchr/testify/assert"
)

func TestNewUser(t *testing.T) {
	user := models.NewUser("John Doe", "john@example.com")
	
	assert.NotNil(t, user)
	assert.Equal(t, "John Doe", user.Name)
	assert.Equal(t, "john@example.com", user.Email)
	assert.Equal(t, uint(0), user.ID) // Should be 0 before saving
}

func TestUserCRUD(t *testing.T) {
	// Setup test database
	utils.SetupTestDB(t)
	defer utils.CleanupTestDB(t)

	t.Run("CreateUser", func(t *testing.T) {
		utils.TruncateTables(t)
		
		user := models.NewUser("Alice", "alice@example.com")
		err := user.CreateUser()
		
		assert.NoError(t, err)
		assert.NotEqual(t, uint(0), user.ID) // Should have an ID after saving
		assert.NotZero(t, user.CreatedAt)
		assert.NotZero(t, user.UpdatedAt)
	})

	t.Run("GetUserByID", func(t *testing.T) {
		utils.TruncateTables(t)
		
		// Create a user first
		originalUser := utils.CreateTestUser("Bob", "bob@example.com")
		
		// Retrieve the user
		retrievedUser, err := models.GetUserByID(originalUser.ID)
		
		assert.NoError(t, err)
		assert.NotNil(t, retrievedUser)
		assert.Equal(t, originalUser.ID, retrievedUser.ID)
		assert.Equal(t, "Bob", retrievedUser.Name)
		assert.Equal(t, "bob@example.com", retrievedUser.Email)
	})

	t.Run("GetUserByID_NotFound", func(t *testing.T) {
		utils.TruncateTables(t)
		
		user, err := models.GetUserByID(999)
		
		assert.Error(t, err)
		assert.Nil(t, user)
	})

	t.Run("GetAllUsers", func(t *testing.T) {
		utils.TruncateTables(t)
		
		// Create multiple users
		utils.CreateTestUser("User1", "user1@example.com")
		utils.CreateTestUser("User2", "user2@example.com")
		utils.CreateTestUser("User3", "user3@example.com")
		
		users, err := models.GetAllUsers()
		
		assert.NoError(t, err)
		assert.Len(t, users, 3)
	})

	t.Run("GetAllUsers_Empty", func(t *testing.T) {
		utils.TruncateTables(t)
		
		users, err := models.GetAllUsers()
		
		assert.NoError(t, err)
		assert.Len(t, users, 0)
	})

	t.Run("UpdateUser", func(t *testing.T) {
		utils.TruncateTables(t)
		
		// Create a user
		user := utils.CreateTestUser("Original Name", "original@example.com")
		originalUpdatedAt := user.UpdatedAt
		
		// Update the user
		user.Name = "Updated Name"
		user.Email = "updated@example.com"
		err := user.UpdateUser()
		
		assert.NoError(t, err)
		assert.Equal(t, "Updated Name", user.Name)
		assert.Equal(t, "updated@example.com", user.Email)
		assert.True(t, user.UpdatedAt.After(originalUpdatedAt))
	})

	t.Run("DeleteUser", func(t *testing.T) {
		utils.TruncateTables(t)
		
		// Create a user
		user := utils.CreateTestUser("To Delete", "delete@example.com")
		userID := user.ID
		
		// Delete the user
		err := user.DeleteUser()
		assert.NoError(t, err)
		
		// Verify user is deleted
		deletedUser, err := models.GetUserByID(userID)
		assert.Error(t, err)
		assert.Nil(t, deletedUser)
	})

	t.Run("CreateUser_DuplicateEmail", func(t *testing.T) {
		utils.TruncateTables(t)
		
		// Create first user
		user1 := utils.CreateTestUser("User1", "duplicate@example.com")
		assert.NotNil(t, user1)
		
		// Try to create second user with same email
		user2 := models.NewUser("User2", "duplicate@example.com")
		err := user2.CreateUser()
		
		assert.Error(t, err) // Should fail due to unique constraint
	})
}