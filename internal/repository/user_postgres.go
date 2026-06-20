package repository

import (
	"context"

	"github.com/abhay2133/api21/internal/domain"
	"gorm.io/gorm"
)

type userPostgresRepository struct {
	db *gorm.DB
}

func NewUserPostgresRepository(db *gorm.DB) domain.UserRepository {
	return &userPostgresRepository{
		db: db,
	}
}

func (r *userPostgresRepository) Create(ctx context.Context, user *domain.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userPostgresRepository) FindAll(ctx context.Context) ([]domain.User, error) {
	var users []domain.User
	err := r.db.WithContext(ctx).Find(&users).Error
	return users, err
}

func (r *userPostgresRepository) FindByID(ctx context.Context, id uint) (*domain.User, error) {
	var user domain.User
	err := r.db.WithContext(ctx).First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userPostgresRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.User{}, id).Error
}
