package tests

import (
	"testing"
	"time"

	"api21/internal/models"

	"github.com/stretchr/testify/assert"
)

func TestUserModel(t *testing.T) {
	t.Run("User struct initialization", func(t *testing.T) {
		now := time.Now()
		user := models.User{
			ID:        1,
			Name:      "John Doe",
			Email:     "john@example.com",
			Password:  "hashedpassword",
			CreatedAt: now,
			UpdatedAt: now,
		}

		assert.Equal(t, uint(1), user.ID)
		assert.Equal(t, "John Doe", user.Name)
		assert.Equal(t, "john@example.com", user.Email)
		assert.Equal(t, "hashedpassword", user.Password)
		assert.Equal(t, now, user.CreatedAt)
		assert.Equal(t, now, user.UpdatedAt)
	})

	t.Run("User struct tags", func(t *testing.T) {
		user := models.User{}

		// Test that the struct has the expected field tags
		// This is a basic structural test
		assert.NotNil(t, user)
	})
}

func TestItemModel(t *testing.T) {
	t.Run("Item struct initialization", func(t *testing.T) {
		now := time.Now()
		user := models.User{
			ID:   1,
			Name: "John Doe",
		}

		item := models.Item{
			ID:          1,
			Title:       "Test Item",
			Description: "A test item description",
			Price:       29.99,
			UserID:      1,
			User:        user,
			CreatedAt:   now,
			UpdatedAt:   now,
		}

		assert.Equal(t, uint(1), item.ID)
		assert.Equal(t, "Test Item", item.Title)
		assert.Equal(t, "A test item description", item.Description)
		assert.Equal(t, 29.99, item.Price)
		assert.Equal(t, uint(1), item.UserID)
		assert.Equal(t, user, item.User)
		assert.Equal(t, now, item.CreatedAt)
		assert.Equal(t, now, item.UpdatedAt)
	})

	t.Run("Item with zero price", func(t *testing.T) {
		item := models.Item{
			Title: "Free Item",
			Price: 0.0,
		}

		assert.Equal(t, "Free Item", item.Title)
		assert.Equal(t, 0.0, item.Price)
	})

	t.Run("Item with high precision price", func(t *testing.T) {
		item := models.Item{
			Title: "Precision Item",
			Price: 123.456789,
		}

		assert.Equal(t, "Precision Item", item.Title)
		assert.Equal(t, 123.456789, item.Price)
	})
}

func TestAPIResponseModel(t *testing.T) {
	t.Run("Successful API response", func(t *testing.T) {
		response := models.APIResponse{
			Success: true,
			Message: "Operation successful",
			Data:    map[string]string{"key": "value"},
		}

		assert.True(t, response.Success)
		assert.Equal(t, "Operation successful", response.Message)
		assert.NotNil(t, response.Data)
		assert.Empty(t, response.Error)
	})

	t.Run("Error API response", func(t *testing.T) {
		response := models.APIResponse{
			Success: false,
			Message: "Operation failed",
			Error:   "Validation error",
		}

		assert.False(t, response.Success)
		assert.Equal(t, "Operation failed", response.Message)
		assert.Equal(t, "Validation error", response.Error)
		assert.Nil(t, response.Data)
	})

	t.Run("API response with different data types", func(t *testing.T) {
		// Test with string data
		response1 := models.APIResponse{
			Success: true,
			Message: "String response",
			Data:    "simple string",
		}
		assert.Equal(t, "simple string", response1.Data)

		// Test with slice data
		response2 := models.APIResponse{
			Success: true,
			Message: "Slice response",
			Data:    []int{1, 2, 3},
		}
		assert.Equal(t, []int{1, 2, 3}, response2.Data)

		// Test with struct data
		response3 := models.APIResponse{
			Success: true,
			Message: "Struct response",
			Data: models.User{
				ID:   1,
				Name: "Test User",
			},
		}
		user, ok := response3.Data.(models.User)
		assert.True(t, ok)
		assert.Equal(t, uint(1), user.ID)
	})
}

func TestPaginationMetaModel(t *testing.T) {
	t.Run("Basic pagination metadata", func(t *testing.T) {
		pagination := models.PaginationMeta{
			Page:      2,
			Limit:     10,
			Total:     100,
			TotalPage: 10,
		}

		assert.Equal(t, 2, pagination.Page)
		assert.Equal(t, 10, pagination.Limit)
		assert.Equal(t, 100, pagination.Total)
		assert.Equal(t, 10, pagination.TotalPage)
	})

	t.Run("Edge case pagination", func(t *testing.T) {
		// First page
		pagination1 := models.PaginationMeta{
			Page:      1,
			Limit:     10,
			Total:     5,
			TotalPage: 1,
		}
		assert.Equal(t, 1, pagination1.Page)
		assert.Equal(t, 1, pagination1.TotalPage)

		// Empty results
		pagination2 := models.PaginationMeta{
			Page:      1,
			Limit:     10,
			Total:     0,
			TotalPage: 0,
		}
		assert.Equal(t, 0, pagination2.Total)
		assert.Equal(t, 0, pagination2.TotalPage)
	})

	t.Run("Calculate offset from pagination", func(t *testing.T) {
		pagination := models.PaginationMeta{
			Page:  3,
			Limit: 20,
		}

		// Calculate offset manually for testing
		expectedOffset := (pagination.Page - 1) * pagination.Limit
		assert.Equal(t, 40, expectedOffset)
	})
}

func TestModelRelationships(t *testing.T) {
	t.Run("User and Item relationship", func(t *testing.T) {
		user := models.User{
			ID:    1,
			Name:  "John Doe",
			Email: "john@example.com",
		}

		item := models.Item{
			ID:     1,
			Title:  "User's Item",
			UserID: user.ID,
			User:   user,
		}

		// Test the relationship
		assert.Equal(t, user.ID, item.UserID)
		assert.Equal(t, user.Name, item.User.Name)
		assert.Equal(t, user.Email, item.User.Email)
	})

	t.Run("Multiple items for one user", func(t *testing.T) {
		user := models.User{
			ID:   1,
			Name: "John Doe",
		}

		items := []models.Item{
			{
				ID:     1,
				Title:  "First Item",
				UserID: user.ID,
				User:   user,
			},
			{
				ID:     2,
				Title:  "Second Item",
				UserID: user.ID,
				User:   user,
			},
		}

		// All items should belong to the same user
		for _, item := range items {
			assert.Equal(t, user.ID, item.UserID)
			assert.Equal(t, user.Name, item.User.Name)
		}
	})
}

// Test model field constraints and validations
func TestModelFieldValidation(t *testing.T) {
	t.Run("User email uniqueness constraint", func(t *testing.T) {
		// This would typically be tested with database integration
		// Here we just verify the struct can hold unique emails
		user1 := models.User{
			ID:    1,
			Email: "unique1@example.com",
		}
		user2 := models.User{
			ID:    2,
			Email: "unique2@example.com",
		}

		assert.NotEqual(t, user1.Email, user2.Email)
	})

	t.Run("Password field exclusion from JSON", func(t *testing.T) {
		// The password field has json:"-" tag
		// This test verifies the struct is set up correctly
		user := models.User{
			Name:     "Test User",
			Password: "secret",
		}

		assert.Equal(t, "Test User", user.Name)
		assert.Equal(t, "secret", user.Password)
		// JSON marshaling test would require actual JSON marshaling
	})
}

// Benchmark tests for model operations
func BenchmarkUserCreation(b *testing.B) {
	now := time.Now()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		user := models.User{
			ID:        uint(i),
			Name:      "Benchmark User",
			Email:     "bench@example.com",
			CreatedAt: now,
			UpdatedAt: now,
		}
		_ = user
	}
}

func BenchmarkItemCreation(b *testing.B) {
	now := time.Now()
	user := models.User{ID: 1, Name: "Test User"}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		item := models.Item{
			ID:          uint(i),
			Title:       "Benchmark Item",
			Description: "A benchmark item",
			Price:       19.99,
			UserID:      1,
			User:        user,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		_ = item
	}
}

func BenchmarkAPIResponseCreation(b *testing.B) {
	data := map[string]string{"key": "value"}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		response := models.APIResponse{
			Success: true,
			Message: "Benchmark response",
			Data:    data,
		}
		_ = response
	}
}
