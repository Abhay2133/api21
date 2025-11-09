package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gobuffalo/validate/v3/validators"
	"github.com/gofrs/uuid"
)

// Redeployment is used by pop to map your redeployments database table to your go code.
type Redeployment struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Version     int        `json:"version" db:"version"`
	Status      string     `json:"status" db:"status"`
	Message     *string    `json:"message" db:"message"`
	Error       *string    `json:"error" db:"error"`
	StartedAt   *time.Time `json:"started_at" db:"started_at"`
	CompletedAt *time.Time `json:"completed_at" db:"completed_at"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// String is not required by pop and may be deleted
func (r Redeployment) String() string {
	jr, _ := json.Marshal(r)
	return string(jr)
}

// Redeployments is not required by pop and may be deleted
type Redeployments []Redeployment

// String is not required by pop and may be deleted
func (r Redeployments) String() string {
	jr, _ := json.Marshal(r)
	return string(jr)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (r *Redeployment) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.Validate(
		&validators.IntIsGreaterThan{Field: r.Version, Name: "Version", Compared: -1},
		&validators.StringIsPresent{Field: r.Status, Name: "Status"},
	), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (r *Redeployment) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (r *Redeployment) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
