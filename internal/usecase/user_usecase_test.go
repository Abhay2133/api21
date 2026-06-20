package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/abhay2133/api21/internal/domain"
	"github.com/abhay2133/api21/internal/usecase"
)

// Mock repository implementing domain.UserRepository interface
type mockUserRepository struct {
	users      []domain.User
	shouldFail bool
}

func (m *mockUserRepository) Create(ctx context.Context, user *domain.User) error {
	if m.shouldFail {
		return errors.New("database connection failed")
	}
	user.ID = uint(len(m.users) + 1)
	m.users = append(m.users, *user)
	return nil
}

func (m *mockUserRepository) FindAll(ctx context.Context) ([]domain.User, error) {
	if m.shouldFail {
		return nil, errors.New("database error")
	}
	return m.users, nil
}

func (m *mockUserRepository) FindByID(ctx context.Context, id uint) (*domain.User, error) {
	if m.shouldFail {
		return nil, errors.New("database error")
	}
	for _, u := range m.users {
		if u.ID == id {
			return &u, nil
		}
	}
	return nil, errors.New("user not found")
}

func (m *mockUserRepository) Delete(ctx context.Context, id uint) error {
	if m.shouldFail {
		return errors.New("database error")
	}
	for i, u := range m.users {
		if u.ID == id {
			m.users = append(m.users[:i], m.users[i+1:]...)
			return nil
		}
	}
	return errors.New("user not found")
}

func TestCreateUser(t *testing.T) {
	repo := &mockUserRepository{}
	uc := usecase.NewUserUsecase(repo)
	ctx := context.Background()

	// Test successful user creation
	u, err := uc.CreateUser(ctx, "Bob Green", "bob@example.com")
	if err != nil {
		t.Fatalf("unexpected error creating user: %v", err)
	}
	if u.Name != "Bob Green" {
		t.Errorf("expected user name to be Bob Green, got %s", u.Name)
	}
	if u.Email != "bob@example.com" {
		t.Errorf("expected email to be bob@example.com, got %s", u.Email)
	}
	if u.ID != 1 {
		t.Errorf("expected ID to be 1, got %d", u.ID)
	}

	// Test validation error: empty name
	_, err = uc.CreateUser(ctx, "", "bob@example.com")
	if err == nil {
		t.Error("expected validation error for empty name, got nil")
	}

	// Test validation error: empty email
	_, err = uc.CreateUser(ctx, "Bob", "")
	if err == nil {
		t.Error("expected validation error for empty email, got nil")
	}

	// Test repository failure
	repo.shouldFail = true
	_, err = uc.CreateUser(ctx, "Bob", "bob@example.com")
	if err == nil {
		t.Error("expected database connection error, got nil")
	}
}

func TestGetUsers(t *testing.T) {
	repo := &mockUserRepository{
		users: []domain.User{
			{ID: 1, Name: "Alice", Email: "alice@example.com"},
			{ID: 2, Name: "Charlie", Email: "charlie@example.com"},
		},
	}
	uc := usecase.NewUserUsecase(repo)
	ctx := context.Background()

	users, err := uc.GetUsers(ctx)
	if err != nil {
		t.Fatalf("unexpected error fetching users: %v", err)
	}
	if len(users) != 2 {
		t.Errorf("expected 2 users, got %d", len(users))
	}
}
