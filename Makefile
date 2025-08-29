# Makefile for API21 GoLang Fiber Project

# Variables
BINARY_NAME=api21
MAIN_PATH=cmd/server/main.go
BUILD_DIR=bin
GO_VERSION := $(shell go version | cut -d ' ' -f 3)
GIT_COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME := $(shell date -u '+%Y-%m-%d_%H:%M:%S')

# Colors for output
GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
NC=\033[0m # No Color

.PHONY: help build run dev clean test lint fmt vet deps install docker-build docker-run migrate

# Default target
all: fmt vet build

# Help command
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# Development commands
dev: ## Run the application in development mode with hot reload
	@echo "$(YELLOW)Starting development server...$(NC)"
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "$(RED)Air not found. Installing...$(NC)"; \
		go install github.com/air-verse/air@latest; \
		air; \
	fi

run: ## Run the application
	@echo "$(YELLOW)Running $(BINARY_NAME)...$(NC)"
	@go run $(MAIN_PATH)

# Build commands
build: ## Build the application
	@echo "$(YELLOW)Building $(BINARY_NAME)...$(NC)"
	@mkdir -p $(BUILD_DIR)
	@go build -ldflags="-X main.Version=$(GIT_COMMIT) -X main.BuildTime=$(BUILD_TIME)" -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@echo "$(GREEN)Build completed: $(BUILD_DIR)/$(BINARY_NAME)$(NC)"

build-linux: ## Build for Linux
	@echo "$(YELLOW)Building for Linux...$(NC)"
	@mkdir -p $(BUILD_DIR)
	@GOOS=linux GOARCH=amd64 go build -ldflags="-X main.Version=$(GIT_COMMIT) -X main.BuildTime=$(BUILD_TIME)" -o $(BUILD_DIR)/$(BINARY_NAME)-linux $(MAIN_PATH)
	@echo "$(GREEN)Linux build completed: $(BUILD_DIR)/$(BINARY_NAME)-linux$(NC)"

build-windows: ## Build for Windows
	@echo "$(YELLOW)Building for Windows...$(NC)"
	@mkdir -p $(BUILD_DIR)
	@GOOS=windows GOARCH=amd64 go build -ldflags="-X main.Version=$(GIT_COMMIT) -X main.BuildTime=$(BUILD_TIME)" -o $(BUILD_DIR)/$(BINARY_NAME)-windows.exe $(MAIN_PATH)
	@echo "$(GREEN)Windows build completed: $(BUILD_DIR)/$(BINARY_NAME)-windows.exe$(NC)"

build-mac: ## Build for macOS
	@echo "$(YELLOW)Building for macOS...$(NC)"
	@mkdir -p $(BUILD_DIR)
	@GOOS=darwin GOARCH=amd64 go build -ldflags="-X main.Version=$(GIT_COMMIT) -X main.BuildTime=$(BUILD_TIME)" -o $(BUILD_DIR)/$(BINARY_NAME)-mac $(MAIN_PATH)
	@echo "$(GREEN)macOS build completed: $(BUILD_DIR)/$(BINARY_NAME)-mac$(NC)"

build-all: build-linux build-windows build-mac ## Build for all platforms

# Testing commands
test: ## Run tests
	@echo "$(YELLOW)Running tests...$(NC)"
	@go test -v ./...

test-coverage: ## Run tests with coverage
	@echo "$(YELLOW)Running tests with coverage...$(NC)"
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "$(GREEN)Coverage report generated: coverage.html$(NC)"

bench: ## Run benchmarks
	@echo "$(YELLOW)Running benchmarks...$(NC)"
	@go test -bench=. -benchmem ./...

# Code quality commands
fmt: ## Format code
	@echo "$(YELLOW)Formatting code...$(NC)"
	@go fmt ./...

vet: ## Run go vet
	@echo "$(YELLOW)Running go vet...$(NC)"
	@go vet ./...

lint: ## Run golangci-lint
	@echo "$(YELLOW)Running linter...$(NC)"
	@if command -v golangci-lint > /dev/null; then \
		golangci-lint run; \
	else \
		echo "$(RED)golangci-lint not found. Install it with: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest$(NC)"; \
	fi

# Dependency commands
deps: ## Download dependencies
	@echo "$(YELLOW)Downloading dependencies...$(NC)"
	@go mod download

tidy: ## Tidy dependencies
	@echo "$(YELLOW)Tidying dependencies...$(NC)"
	@go mod tidy

vendor: ## Create vendor directory
	@echo "$(YELLOW)Creating vendor directory...$(NC)"
	@go mod vendor

# Installation commands
install: ## Install the application
	@echo "$(YELLOW)Installing $(BINARY_NAME)...$(NC)"
	@go install $(MAIN_PATH)
	@echo "$(GREEN)$(BINARY_NAME) installed successfully$(NC)"

# Database commands
migrate: ## Run database migrations
	@echo "$(YELLOW)Running database migrations...$(NC)"
	@go run $(MAIN_PATH) -migrate

# Docker commands
docker-build: ## Build Docker image
	@echo "$(YELLOW)Building Docker image...$(NC)"
	@docker build -t $(BINARY_NAME):latest .

docker-run: ## Run Docker container
	@echo "$(YELLOW)Running Docker container...$(NC)"
	@docker run -p 3000:3000 --env-file .env $(BINARY_NAME):latest

# Utility commands
clean: ## Clean build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf $(BUILD_DIR)
	@rm -f coverage.out coverage.html
	@echo "$(GREEN)Clean completed$(NC)"

setup: ## Setup development environment
	@echo "$(YELLOW)Setting up development environment...$(NC)"
	@go mod tidy
	@cp .env.example .env
	@go install github.com/air-verse/air@latest
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "$(GREEN)Development environment setup completed$(NC)"
	@echo "$(YELLOW)Don't forget to update your .env file with your configuration!$(NC)"

info: ## Show project information
	@echo "$(GREEN)Project Information:$(NC)"
	@echo "  Binary Name: $(BINARY_NAME)"
	@echo "  Go Version: $(GO_VERSION)"
	@echo "  Git Commit: $(GIT_COMMIT)"
	@echo "  Build Time: $(BUILD_TIME)"

# Start/Stop commands for production
start: build ## Build and start the application
	@echo "$(YELLOW)Starting $(BINARY_NAME)...$(NC)"
	@./$(BUILD_DIR)/$(BINARY_NAME) &
	@echo "$(GREEN)$(BINARY_NAME) started in background$(NC)"

stop: ## Stop the running application
	@echo "$(YELLOW)Stopping $(BINARY_NAME)...$(NC)"
	@pkill -f $(BINARY_NAME) || echo "No running instance found"
	@echo "$(GREEN)$(BINARY_NAME) stopped$(NC)"

restart: stop start ## Restart the application
