package models

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"api21/src/config"
)

// Clipboard represents a clipboard entry in the system
type Clipboard struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title" gorm:"uniqueIndex;not null"`
	Content   string    `json:"content" gorm:"type:text;not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName overrides the table name used by GORM
func (Clipboard) TableName() string {
	return "clipboard"
}

// NewClipboard creates a new Clipboard instance
func NewClipboard(title, content string) *Clipboard {
	return &Clipboard{
		Title:   title,
		Content: content,
	}
}

// generateRandomID creates a random short ID (8 characters)
func generateRandomID() string {
	bytes := make([]byte, 4) // 4 bytes = 8 hex characters
	if _, err := rand.Read(bytes); err != nil {
		// Fallback to timestamp-based ID if random fails
		return hex.EncodeToString([]byte(time.Now().Format("15040500")))[:8]
	}
	return hex.EncodeToString(bytes)
}

// GetAllClipboards retrieves all clipboard entries from the database
func GetAllClipboards() ([]Clipboard, error) {
	var clipboards []Clipboard
	result := config.GetDB().Find(&clipboards)
	return clipboards, result.Error
}

// GetClipboardByID retrieves a clipboard entry by ID from the database
func GetClipboardByID(id uint) (*Clipboard, error) {
	var clipboard Clipboard
	result := config.GetDB().First(&clipboard, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &clipboard, nil
}

// GetClipboardByTitle retrieves a clipboard entry by title from the database
func GetClipboardByTitle(title string) (*Clipboard, error) {
	var clipboard Clipboard
	result := config.GetDB().Where("title = ?", title).First(&clipboard)
	if result.Error != nil {
		return nil, result.Error
	}
	return &clipboard, nil
}

// CreateClipboard creates a new clipboard entry in the database
func (c *Clipboard) CreateClipboard() error {
	// If no title is provided, generate a random short ID
	if c.Title == "" {
		for {
			randomID := generateRandomID()
			// Check if this ID already exists
			if _, err := GetClipboardByTitle(randomID); err != nil {
				// ID doesn't exist, use it
				c.Title = randomID
				break
			}
			// If ID exists, generate another one (very unlikely but possible)
		}
	}

	result := config.GetDB().Create(c)
	return result.Error
}

// UpdateClipboard updates an existing clipboard entry in the database
func (c *Clipboard) UpdateClipboard() error {
	result := config.GetDB().Save(c)
	return result.Error
}

// DeleteClipboard deletes a clipboard entry from the database
func (c *Clipboard) DeleteClipboard() error {
	result := config.GetDB().Delete(c)
	return result.Error
}
