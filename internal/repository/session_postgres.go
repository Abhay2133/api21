package repository

import (
	"context"

	"github.com/abhay2133/api21/internal/domain"
	"gorm.io/gorm"
)

type sessionPostgresRepository struct {
	db *gorm.DB
}

func NewSessionPostgresRepository(db *gorm.DB) domain.SessionRepository {
	return &sessionPostgresRepository{
		db: db,
	}
}

func (r *sessionPostgresRepository) Create(ctx context.Context, session *domain.Session) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *sessionPostgresRepository) FindByToken(ctx context.Context, token string) (*domain.Session, error) {
	var s domain.Session
	err := r.db.WithContext(ctx).Where("token = ? AND is_active = ?", token, true).Take(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *sessionPostgresRepository) FindAllByUsername(ctx context.Context, username string) ([]domain.Session, error) {
	var sessions []domain.Session
	err := r.db.WithContext(ctx).Where("username = ?", username).Order("id desc").Limit(50).Find(&sessions).Error
	return sessions, err
}

func (r *sessionPostgresRepository) DeactivateAllByUsername(ctx context.Context, username string) error {
	return r.db.WithContext(ctx).Model(&domain.Session{}).Where("username = ? AND is_active = ?", username, true).Update("is_active", false).Error
}

func (r *sessionPostgresRepository) DeactivateByToken(ctx context.Context, token string) error {
	return r.db.WithContext(ctx).Model(&domain.Session{}).Where("token = ?", token).Update("is_active", false).Error
}

func (r *sessionPostgresRepository) DeactivateByID(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Model(&domain.Session{}).Where("id = ?", id).Update("is_active", false).Error
}
