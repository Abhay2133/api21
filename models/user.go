package models

import (
	"encoding/json"
	"errors"
	"time"
)

// User is a GORM model representing a user.
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string    `json:"name" gorm:"not null"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// String prints the user as JSON.
func (u User) String() string {
	ju, _ := json.Marshal(u)
	return string(ju)
}

// Users is a list of users.
type Users []User

// String prints users as JSON.
func (u Users) String() string {
	ju, _ := json.Marshal(u)
	return string(ju)
}

// Validate checks for valid fields on User.
func (u *User) Validate() error {
	if u.Name == "" {
		return errors.New("name is required")
	}
	if u.Email == "" {
		return errors.New("email is required")
	}
	return nil
}
