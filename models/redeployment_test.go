package models

import (
	"github.com/gofrs/uuid"
)

func (ms *ModelSuite) Test_Redeployment() {
	// Create a new redeployment
	r := &Redeployment{
		ID:      uuid.Must(uuid.NewV4()),
		Version: 1,
		Status:  "pending",
	}

	// Test Create
	err := ms.DB.Create(r)
	ms.NoError(err)
	ms.NotZero(r.ID)

	// Test Read
	found := &Redeployment{}
	err = ms.DB.Find(found, r.ID)
	ms.NoError(err)
	ms.Equal(r.Version, found.Version)
	ms.Equal(r.Status, found.Status)

	// Test Update
	r.Status = "in_progress"
	err = ms.DB.Update(r)
	ms.NoError(err)

	// Verify update
	updated := &Redeployment{}
	err = ms.DB.Find(updated, r.ID)
	ms.NoError(err)
	ms.Equal("in_progress", updated.Status)

	// Test Delete
	err = ms.DB.Destroy(r)
	ms.NoError(err)

	// Verify deletion
	deleted := &Redeployment{}
	err = ms.DB.Find(deleted, r.ID)
	ms.Error(err)
}
