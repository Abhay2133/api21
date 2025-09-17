package models

import (
	"testing"

	"api21/src/models"
	"api21/tests/utils"

	"github.com/stretchr/testify/assert"
)

func TestNewClipboard(t *testing.T) {
	clipboard := models.NewClipboard("test_snippet", "console.log('Hello World');")
	
	assert.NotNil(t, clipboard)
	assert.Equal(t, "test_snippet", clipboard.Title)
	assert.Equal(t, "console.log('Hello World');", clipboard.Content)
	assert.Equal(t, uint(0), clipboard.ID) // Should be 0 before saving
}

func TestClipboardCRUD(t *testing.T) {
	// Setup test database
	utils.SetupTestDB(t)
	defer utils.CleanupTestDB(t)

	t.Run("CreateClipboard", func(t *testing.T) {
		utils.TruncateTables(t)
		
		clipboard := models.NewClipboard("my_snippet", "function test() { return 'hello'; }")
		err := clipboard.CreateClipboard()
		
		assert.NoError(t, err)
		assert.NotEqual(t, uint(0), clipboard.ID) // Should have an ID after saving
		assert.NotZero(t, clipboard.CreatedAt)
		assert.NotZero(t, clipboard.UpdatedAt)
	})

	t.Run("CreateClipboard_WithoutTitle", func(t *testing.T) {
		utils.TruncateTables(t)
		
		clipboard := models.NewClipboard("", "some content without title")
		err := clipboard.CreateClipboard()
		
		assert.NoError(t, err)
		assert.NotEmpty(t, clipboard.Title) // Should get a generated title
		assert.Len(t, clipboard.Title, 8) // Should be 8 characters (random ID)
	})

	t.Run("GetClipboardByID", func(t *testing.T) {
		utils.TruncateTables(t)
		
		// Create a clipboard first
		originalClipboard := utils.CreateTestClipboard("test_id", "test content")
		
		// Retrieve the clipboard
		retrievedClipboard, err := models.GetClipboardByID(originalClipboard.ID)
		
		assert.NoError(t, err)
		assert.NotNil(t, retrievedClipboard)
		assert.Equal(t, originalClipboard.ID, retrievedClipboard.ID)
		assert.Equal(t, "test_id", retrievedClipboard.Title)
		assert.Equal(t, "test content", retrievedClipboard.Content)
	})

	t.Run("GetClipboardByTitle", func(t *testing.T) {
		utils.TruncateTables(t)
		
		// Create a clipboard first
		originalClipboard := utils.CreateTestClipboard("unique_title", "test content")
		
		// Retrieve the clipboard by title
		retrievedClipboard, err := models.GetClipboardByTitle("unique_title")
		
		assert.NoError(t, err)
		assert.NotNil(t, retrievedClipboard)
		assert.Equal(t, originalClipboard.ID, retrievedClipboard.ID)
		assert.Equal(t, "unique_title", retrievedClipboard.Title)
		assert.Equal(t, "test content", retrievedClipboard.Content)
	})

	t.Run("GetClipboardByID_NotFound", func(t *testing.T) {
		utils.TruncateTables(t)
		
		clipboard, err := models.GetClipboardByID(999)
		
		assert.Error(t, err)
		assert.Nil(t, clipboard)
	})

	t.Run("GetClipboardByTitle_NotFound", func(t *testing.T) {
		utils.TruncateTables(t)
		
		clipboard, err := models.GetClipboardByTitle("nonexistent")
		
		assert.Error(t, err)
		assert.Nil(t, clipboard)
	})

	t.Run("GetAllClipboards", func(t *testing.T) {
		utils.TruncateTables(t)
		
		// Create multiple clipboards
		utils.CreateTestClipboard("snippet1", "content1")
		utils.CreateTestClipboard("snippet2", "content2")
		utils.CreateTestClipboard("snippet3", "content3")
		
		clipboards, err := models.GetAllClipboards()
		
		assert.NoError(t, err)
		assert.Len(t, clipboards, 3)
	})

	t.Run("GetAllClipboards_Empty", func(t *testing.T) {
		utils.TruncateTables(t)
		
		clipboards, err := models.GetAllClipboards()
		
		assert.NoError(t, err)
		assert.Len(t, clipboards, 0)
	})

	t.Run("UpdateClipboard", func(t *testing.T) {
		utils.TruncateTables(t)
		
		// Create a clipboard
		clipboard := utils.CreateTestClipboard("original", "original content")
		originalUpdatedAt := clipboard.UpdatedAt
		
		// Update the clipboard
		clipboard.Title = "updated_title"
		clipboard.Content = "updated content"
		err := clipboard.UpdateClipboard()
		
		assert.NoError(t, err)
		assert.Equal(t, "updated_title", clipboard.Title)
		assert.Equal(t, "updated content", clipboard.Content)
		assert.True(t, clipboard.UpdatedAt.After(originalUpdatedAt))
	})

	t.Run("DeleteClipboard", func(t *testing.T) {
		utils.TruncateTables(t)
		
		// Create a clipboard
		clipboard := utils.CreateTestClipboard("to_delete", "content to delete")
		clipboardID := clipboard.ID
		
		// Delete the clipboard
		err := clipboard.DeleteClipboard()
		assert.NoError(t, err)
		
		// Verify clipboard is deleted
		deletedClipboard, err := models.GetClipboardByID(clipboardID)
		assert.Error(t, err)
		assert.Nil(t, deletedClipboard)
	})

	t.Run("CreateClipboard_DuplicateTitle", func(t *testing.T) {
		utils.TruncateTables(t)
		
		// Create first clipboard
		clipboard1 := utils.CreateTestClipboard("duplicate_title", "content1")
		assert.NotNil(t, clipboard1)
		
		// Try to create second clipboard with same title
		clipboard2 := models.NewClipboard("duplicate_title", "content2")
		err := clipboard2.CreateClipboard()
		
		assert.Error(t, err) // Should fail due to unique constraint
	})
}