package usecase

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"

	"github.com/abhay2133/api21/internal/domain"
)

type sessionUsecase struct {
	repo domain.SessionRepository
}

func NewSessionUsecase(repo domain.SessionRepository) domain.SessionUsecase {
	return &sessionUsecase{
		repo: repo,
	}
}

func (u *sessionUsecase) CreateSession(ctx context.Context, username, ip, ua string, deactivateOthers bool) (*domain.Session, error) {
	if deactivateOthers {
		if err := u.repo.DeactivateAllByUsername(ctx, username); err != nil {
			return nil, err
		}
	}

	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, err
	}
	token := hex.EncodeToString(tokenBytes)

	session := &domain.Session{
		Token:     token,
		Username:  username,
		IPAddress: ip,
		UserAgent: ua,
		IsActive:  true,
	}

	if err := u.repo.Create(ctx, session); err != nil {
		return nil, err
	}

	return session, nil
}

func (u *sessionUsecase) ValidateToken(ctx context.Context, token string) (*domain.Session, error) {
	if token == "" {
		return nil, errors.New("empty token")
	}
	return u.repo.FindByToken(ctx, token)
}

func (u *sessionUsecase) GetActiveSessions(ctx context.Context, username string) ([]domain.Session, error) {
	return u.repo.FindAllByUsername(ctx, username)
}

func (u *sessionUsecase) RevokeSession(ctx context.Context, token string) error {
	return u.repo.DeactivateByToken(ctx, token)
}

func (u *sessionUsecase) RevokeSessionByID(ctx context.Context, id uint, username string) error {
	// Optional security check: make sure the session to revoke belongs to the requested user.
	// Since we are checking active sessions for the current logged-in user, we can enforce username match.
	sessions, err := u.repo.FindAllByUsername(ctx, username)
	if err != nil {
		return err
	}
	belongs := false
	for _, s := range sessions {
		if s.ID == id {
			belongs = true
			break
		}
	}
	if !belongs {
		return errors.New("unauthorized to revoke this session")
	}

	return u.repo.DeactivateByID(ctx, id)
}
