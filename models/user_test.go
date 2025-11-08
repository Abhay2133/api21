package models

import (
	"github.com/gofrs/uuid"
)

func (ms *ModelSuite) Test_User() {
	// Create a new user
	u := &User{
		ID:                uuid.Must(uuid.NewV4()),
		Name:              "Test User",
		Email:             "test@example.com",
		EncryptedPassword: "hashedpassword123",
	}

	// Test Create
	err := ms.DB.Create(u)
	ms.NoError(err)
	ms.NotZero(u.ID)

	// Test Read
	found := &User{}
	err = ms.DB.Find(found, u.ID)
	ms.NoError(err)
	ms.Equal(u.Name, found.Name)
	ms.Equal(u.Email, found.Email)

	// Test Update
	u.Name = "Updated User"
	err = ms.DB.Update(u)
	ms.NoError(err)

	// Verify update
	updated := &User{}
	err = ms.DB.Find(updated, u.ID)
	ms.NoError(err)
	ms.Equal("Updated User", updated.Name)

	// Test Delete
	err = ms.DB.Destroy(u)
	ms.NoError(err)

	// Verify deletion
	deleted := &User{}
	err = ms.DB.Find(deleted, u.ID)
	ms.Error(err)
}
