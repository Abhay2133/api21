package models

import (
	"time"

	"api21/src/config"
)

// User represents a user in the system
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"not null"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// NewUser creates a new User instance
func NewUser(name, email string) *User {
	return &User{
		Name:  name,
		Email: email,
	}
}

// GetAllUsers retrieves all users from the database
func GetAllUsers() ([]User, error) {
	var users []User
	result := config.GetDB().Find(&users)
	return users, result.Error
}

// GetUserByID retrieves a user by ID from the database
func GetUserByID(id uint) (*User, error) {
	var user User
	result := config.GetDB().First(&user, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

// CreateUser creates a new user in the database
func (u *User) CreateUser() error {
	result := config.GetDB().Create(u)
	return result.Error
}

// UpdateUser updates an existing user in the database
func (u *User) UpdateUser() error {
	result := config.GetDB().Save(u)
	return result.Error
}

// DeleteUser deletes a user from the database
func (u *User) DeleteUser() error {
	result := config.GetDB().Delete(u)
	return result.Error
}

// GetMockUsers returns a list of mock users for demonstration (deprecated - use GetAllUsers)
func GetMockUsers() []User {
	return []User{
		{
			ID:        1,
			Name:      "John Doe",
			Email:     "john.doe@example.com",
			CreatedAt: time.Now().Add(-24 * time.Hour),
			UpdatedAt: time.Now().Add(-24 * time.Hour),
		},
		{
			ID:        2,
			Name:      "Jane Smith",
			Email:     "jane.smith@example.com",
			CreatedAt: time.Now().Add(-12 * time.Hour),
			UpdatedAt: time.Now().Add(-12 * time.Hour),
		},
		{
			ID:        3,
			Name:      "Bob Johnson",
			Email:     "bob.johnson@example.com",
			CreatedAt: time.Now().Add(-6 * time.Hour),
			UpdatedAt: time.Now().Add(-6 * time.Hour),
		},
	}
}
