package domain

import (
	"context"
	"time"
)

type User struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(255);not null" json:"name" binding:"required"`
	Email     string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email" binding:"required,email"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

type UserRepository interface {
	Create(ctx context.Context, user *User) error
	FindAll(ctx context.Context) ([]User, error)
	FindByID(ctx context.Context, id uint) (*User, error)
	Delete(ctx context.Context, id uint) error
}

type UserUsecase interface {
	CreateUser(ctx context.Context, name, email string) (*User, error)
	GetUsers(ctx context.Context) ([]User, error)
	GetUserByID(ctx context.Context, id uint) (*User, error)
	DeleteUser(ctx context.Context, id uint) error
}
