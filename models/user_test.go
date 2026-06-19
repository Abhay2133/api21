package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_User(t *testing.T) {
	// Clean table
	DB.Exec("DELETE FROM users")

	var count int64
	err := DB.Model(&User{}).Count(&count).Error
	assert.NoError(t, err)
	assert.Equal(t, int64(0), count)

	// Test validation error
	invalidUser := &User{
		Name:  "",
		Email: "",
	}
	assert.Error(t, invalidUser.Validate())

	// Create valid user
	u := &User{
		Name:  "Abhay Bisht",
		Email: "abhay@example.com",
	}
	assert.NoError(t, u.Validate())

	err = DB.Create(u).Error
	assert.NoError(t, err)
	assert.NotZero(t, u.ID)

	// Check count again
	err = DB.Model(&User{}).Count(&count).Error
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)

	// Unique email constraint test
	dupUser := &User{
		Name:  "Abhay Copy",
		Email: "abhay@example.com",
	}
	err = DB.Create(dupUser).Error
	assert.Error(t, err)
}
