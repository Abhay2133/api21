package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/abhay2133/api21/internal/domain"
	"github.com/abhay2133/api21/internal/usecase"
)

type mockSessionRepository struct {
	sessions []domain.Session
}

func (m *mockSessionRepository) Create(ctx context.Context, session *domain.Session) error {
	session.ID = uint(len(m.sessions) + 1)
	m.sessions = append(m.sessions, *session)
	return nil
}

func (m *mockSessionRepository) FindByToken(ctx context.Context, token string) (*domain.Session, error) {
	for i, s := range m.sessions {
		if s.Token == token && s.IsActive {
			return &m.sessions[i], nil
		}
	}
	return nil, errors.New("not found")
}

func (m *mockSessionRepository) FindAllByUsername(ctx context.Context, username string) ([]domain.Session, error) {
	var results []domain.Session
	for _, s := range m.sessions {
		if s.Username == username {
			results = append(results, s)
		}
	}
	return results, nil
}

func (m *mockSessionRepository) DeactivateAllByUsername(ctx context.Context, username string) error {
	for i, s := range m.sessions {
		if s.Username == username {
			m.sessions[i].IsActive = false
		}
	}
	return nil
}

func (m *mockSessionRepository) DeactivateByToken(ctx context.Context, token string) error {
	for i, s := range m.sessions {
		if s.Token == token {
			m.sessions[i].IsActive = false
		}
	}
	return nil
}

func (m *mockSessionRepository) DeactivateByID(ctx context.Context, id uint) error {
	for i, s := range m.sessions {
		if s.ID == id {
			m.sessions[i].IsActive = false
		}
	}
	return nil
}

func TestSessionUsecase_CreateSession(t *testing.T) {
	repo := &mockSessionRepository{}
	u := usecase.NewSessionUsecase(repo)

	// Test basic session creation
	s, err := u.CreateSession(context.Background(), "admin", "127.0.0.1", "Mozilla", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if s.Username != "admin" {
		t.Errorf("expected username admin, got %s", s.Username)
	}
	if len(s.Token) != 64 {
		t.Errorf("expected 64 character hex token, got %d", len(s.Token))
	}
	if s.IPAddress != "127.0.0.xxx" {
		t.Errorf("expected masked IP address 127.0.0.xxx, got %s", s.IPAddress)
	}

	// Test create session with deactivateOthers = true
	s2, err := u.CreateSession(context.Background(), "admin", "127.0.0.1", "Mozilla", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify s is now inactive, s2 is active
	sCheck1, _ := u.ValidateToken(context.Background(), s.Token, "127.0.0.1", "Mozilla")
	if sCheck1 != nil {
		t.Error("expected first session to be deactivated")
	}

	sCheck2, err := u.ValidateToken(context.Background(), s2.Token, "127.0.0.1", "Mozilla")
	if err != nil || sCheck2 == nil {
		t.Error("expected second session to be active")
	}

	// Test stolen token / fingerprint mismatch (different IP)
	sCheckMismatchIP, err := u.ValidateToken(context.Background(), s2.Token, "192.168.1.1", "Mozilla")
	if err == nil || sCheckMismatchIP != nil {
		t.Error("expected validation to fail due to IP fingerprint mismatch")
	}

	// Test stolen token / fingerprint mismatch (different UA)
	sCheckMismatchUA, err := u.ValidateToken(context.Background(), s2.Token, "127.0.0.1", "Chrome")
	if err == nil || sCheckMismatchUA != nil {
		t.Error("expected validation to fail due to UA fingerprint mismatch")
	}
}

func TestSessionUsecase_RevokeSession(t *testing.T) {
	repo := &mockSessionRepository{}
	u := usecase.NewSessionUsecase(repo)

	s, err := u.CreateSession(context.Background(), "admin", "127.0.0.1", "Mozilla", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	err = u.RevokeSession(context.Background(), s.Token)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	sCheck, _ := u.ValidateToken(context.Background(), s.Token, "127.0.0.1", "Mozilla")
	if sCheck != nil {
		t.Error("expected session to be revoked")
	}
}

func TestSessionUsecase_RevokeSessionByID(t *testing.T) {
	repo := &mockSessionRepository{}
	u := usecase.NewSessionUsecase(repo)

	s1, _ := u.CreateSession(context.Background(), "admin", "127.0.0.1", "Mozilla", false)
	s2, _ := u.CreateSession(context.Background(), "admin", "127.0.0.1", "Mozilla", false)

	err := u.RevokeSessionByID(context.Background(), s1.ID, "admin")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	sCheck1, _ := u.ValidateToken(context.Background(), s1.Token, "127.0.0.1", "Mozilla")
	if sCheck1 != nil {
		t.Error("expected first session to be revoked by ID")
	}

	sCheck2, err := u.ValidateToken(context.Background(), s2.Token, "127.0.0.1", "Mozilla")
	if err != nil || sCheck2 == nil {
		t.Error("expected second session to remain active")
	}

	// Test revoking session belonging to another user
	err = u.RevokeSessionByID(context.Background(), s2.ID, "other_admin")
	if err == nil {
		t.Error("expected error when revoking session of another user")
	}
}
