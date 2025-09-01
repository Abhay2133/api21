package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hashedPassword), nil
}

// CheckPassword verifies a password against its hash
func CheckPassword(password, hashedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// GenerateRandomString generates a random string of specified length
func GenerateRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes)[:length], nil
}

// ValidateEmail validates an email address format
func ValidateEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// SanitizeString removes potentially harmful characters from a string
func SanitizeString(input string) string {
	// Remove script tags and their content first
	scriptRe := regexp.MustCompile(`<script[^>]*>.*?</script>`)
	sanitized := scriptRe.ReplaceAllString(input, "")

	// Remove remaining HTML tags
	htmlRe := regexp.MustCompile(`<[^>]*>`)
	sanitized = htmlRe.ReplaceAllString(sanitized, "")

	// Trim whitespace
	sanitized = strings.TrimSpace(sanitized)

	return sanitized
}

// FormatTimestamp formats a time.Time to a standard string format
func FormatTimestamp(t time.Time) string {
	return t.Format("2006-01-02 15:04:05")
}

// CalculatePagination calculates pagination parameters
func CalculatePagination(page, limit, total int) map[string]int {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	totalPages := (total + limit - 1) / limit
	offset := (page - 1) * limit

	return map[string]int{
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": totalPages,
		"offset":      offset,
	}
}
