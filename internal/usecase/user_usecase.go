package usecase

import (
	"context"
	"errors"
	"strings"

	"github.com/abhay2133/api21/internal/domain"
)

type userUsecase struct {
	userRepo domain.UserRepository
}

func NewUserUsecase(repo domain.UserRepository) domain.UserUsecase {
	return &userUsecase{
		userRepo: repo,
	}
}

func (u *userUsecase) CreateUser(ctx context.Context, name, email string) (*domain.User, error) {
	name = strings.TrimSpace(name)
	email = strings.TrimSpace(strings.ToLower(email))

	if name == "" {
		return nil, errors.New("name cannot be empty")
	}
	if email == "" {
		return nil, errors.New("email cannot be empty")
	}

	user := &domain.User{
		Name:  name,
		Email: email,
	}

	err := u.userRepo.Create(ctx, user)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (u *userUsecase) GetUsers(ctx context.Context) ([]domain.User, error) {
	return u.userRepo.FindAll(ctx)
}

func (u *userUsecase) GetUserByID(ctx context.Context, id uint) (*domain.User, error) {
	return u.userRepo.FindByID(ctx, id)
}

func (u *userUsecase) DeleteUser(ctx context.Context, id uint) error {
	// First ensure user exists
	_, err := u.userRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	return u.userRepo.Delete(ctx, id)
}
