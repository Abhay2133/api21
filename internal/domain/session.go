package domain

import (
	"context"
	"time"
)

type Session struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Token     string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"token"`
	Username  string    `gorm:"type:varchar(255);not null" json:"username"`
	IPAddress string    `gorm:"type:varchar(45);not null" json:"ip_address"`
	UserAgent string    `gorm:"type:text;not null" json:"user_agent"`
	IsActive  bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
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
	ValidateToken(ctx context.Context, token string) (*Session, error)
	GetActiveSessions(ctx context.Context, username string) ([]Session, error)
	RevokeSession(ctx context.Context, token string) error
	RevokeSessionByID(ctx context.Context, id uint, username string) error
}
