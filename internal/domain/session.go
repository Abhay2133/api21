package domain

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"time"
)

type Session struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Token       string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"token"`
	Username    string    `gorm:"type:varchar(255);not null" json:"username"`
	IPAddress   string    `gorm:"type:varchar(45);not null" json:"ip_address"`
	UserAgent   string    `gorm:"type:text;not null" json:"user_agent"`
	SessionHash string    `gorm:"type:varchar(255);not null;default:''" json:"session_hash"`
	IsActive    bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

type SessionRepository interface {
	Create(ctx context.Context, session *Session) error
	FindByToken(ctx context.Context, token string) (*Session, error)
	FindAllByUsername(ctx context.Context, username string) ([]Session, error)
	DeactivateAllByUsername(ctx context.Context, username string) error
	DeactivateByToken(ctx context.Context, token string) error
	DeactivateByID(ctx context.Context, id uint) error
}

type SessionUsecase interface {
	CreateSession(ctx context.Context, username, ip, ua string, deactivateOthers bool) (*Session, error)
	ValidateToken(ctx context.Context, token string, currentIP string, currentUA string) (*Session, error)
	GetActiveSessions(ctx context.Context, username string) ([]Session, error)
	RevokeSession(ctx context.Context, token string) error
	RevokeSessionByID(ctx context.Context, id uint, username string) error
}

// GenerateSessionHash hashes client attributes to create a consistent fingerprint
func GenerateSessionHash(username, ip, ua string) string {
	browser, device, os := parseUA(ua)
	data := strings.Join([]string{browser, device, os, ua, ip, username}, "|")
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

func parseUA(ua string) (browser, device, os string) {
	uaLower := strings.ToLower(ua)

	// OS
	if strings.Contains(uaLower, "windows") {
		os = "Windows"
	} else if strings.Contains(uaLower, "macintosh") || strings.Contains(uaLower, "mac os") {
		os = "macOS"
	} else if strings.Contains(uaLower, "linux") {
		os = "Linux"
	} else if strings.Contains(uaLower, "android") {
		os = "Android"
	} else if strings.Contains(uaLower, "iphone") || strings.Contains(uaLower, "ipad") {
		os = "iOS"
	} else {
		os = "Unknown OS"
	}

	// Device
	if strings.Contains(uaLower, "mobi") || strings.Contains(uaLower, "iphone") || strings.Contains(uaLower, "android") {
		device = "Mobile"
	} else if strings.Contains(uaLower, "ipad") || strings.Contains(uaLower, "tablet") {
		device = "Tablet"
	} else {
		device = "Desktop"
	}

	// Browser
	if strings.Contains(uaLower, "edg/") || strings.Contains(uaLower, "edge") {
		browser = "Edge"
	} else if strings.Contains(uaLower, "opr/") || strings.Contains(uaLower, "opera") {
		browser = "Opera"
	} else if strings.Contains(uaLower, "chrome") {
		browser = "Chrome"
	} else if strings.Contains(uaLower, "firefox") {
		browser = "Firefox"
	} else if strings.Contains(uaLower, "safari") {
		browser = "Safari"
	} else {
		browser = "Unknown Browser"
	}

	return browser, device, os
}
