.PHONY: run build clean dev test help docker-up docker-down docker-logs docker-ps db-url

# Variables
BINARY_NAME=api21
BINARY_PATH=./bin/$(BINARY_NAME)
SRC_DIR=./src
MAIN_FILE=main.go

# Default target
help: ## Display this help message
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-10s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

run: ## Run the application in development mode
	@echo "🚀 Starting API21 server..."
	go run $(MAIN_FILE)

run-with-ping: ## Run with ping job enabled (example URL and 2-minute interval)
	@echo "🚀 Starting API21 server with ping job enabled..."
	PING_URL=https://httpbin.org/get PING_INTERVAL=2 go run $(MAIN_FILE)

build: ## Build the application binary
	@echo "🔨 Building API21..."
	@mkdir -p bin
	go build -o $(BINARY_PATH) $(MAIN_FILE)
	@echo "✅ Build complete: $(BINARY_PATH)"

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf bin/
	go clean
	@echo "✅ Clean complete"

dev: ## Run with auto-reload (uses air or reflex if available, otherwise runs directly)
	@echo "🔄 Starting development server (auto-reload if available)..."
	@if command -v air > /dev/null; then \
		echo "Using air for auto-reload..."; \
		air; \
	elif command -v reflex > /dev/null; then \
		echo "Using reflex for auto-reload..."; \
		reflex -s -r '\.go$$' -- sh -c "go run $(MAIN_FILE)"; \
	else \
		echo "air/reflex not found, running without auto-reload..."; \
		go run $(MAIN_FILE); \
	fi

test: ## Run tests
	@echo "🧪 Running tests..."
	go test -v ./tests/...

test-coverage: ## Run tests with coverage report
	@echo "🧪 Running tests with coverage..."
	@mkdir -p coverage
	go test -v -coverprofile=coverage/coverage.out ./tests/...
	go tool cover -html=coverage/coverage.out -o coverage/coverage.html
	@echo "✅ Coverage report generated at coverage/coverage.html"

test-models: ## Run only model tests
	@echo "🧪 Running model tests..."
	go test -v ./tests/models/

test-controllers: ## Run only controller tests
	@echo "🧪 Running controller tests..."
	go test -v ./tests/controllers/

test-watch: ## Run tests in watch mode (requires entr)
	@echo "🔄 Running tests in watch mode..."
	@if ! command -v entr > /dev/null; then \
		echo "❌ Error: entr is required for watch mode"; \
		echo "Install with: apt-get install entr (Linux) or brew install entr (macOS)"; \
		exit 1; \
	fi
	@find . -name "*.go" | entr -c make test

test-clean: ## Clean test artifacts
	@echo "🧹 Cleaning test artifacts..."
	rm -rf coverage/
	go clean -testcache
	@echo "✅ Test artifacts cleaned"

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	go mod tidy
	go mod download
	@echo "✅ Dependencies installed"

fmt: ## Format code
	@echo "🎨 Formatting code..."
	go fmt ./...
	@echo "✅ Code formatted"

lint: ## Run linter (requires golangci-lint)
	@echo "🔍 Running linter..."
	@if ! command -v golangci-lint > /dev/null; then \
		echo "Installing golangci-lint..."; \
		go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest; \
	fi
	golangci-lint run

deps: ## Show dependency graph
	@echo "📊 Dependency graph:"
	go mod graph

mod-update: ## Update all dependencies
	@echo "⬆️  Updating dependencies..."
	go get -u ./...
	go mod tidy
	@echo "✅ Dependencies updated"

# Production targets
build-linux: ## Build for Linux
	@echo "🐧 Building for Linux..."
	@mkdir -p bin
	GOOS=linux GOARCH=amd64 go build -o bin/$(BINARY_NAME)-linux $(MAIN_FILE)
	@echo "✅ Linux build complete: bin/$(BINARY_NAME)-linux"

build-windows: ## Build for Windows
	@echo "🪟 Building for Windows..."
	@mkdir -p bin
	GOOS=windows GOARCH=amd64 go build -o bin/$(BINARY_NAME).exe $(MAIN_FILE)
	@echo "✅ Windows build complete: bin/$(BINARY_NAME).exe"

build-mac: ## Build for macOS
	@echo "🍎 Building for macOS..."
	@mkdir -p bin
	GOOS=darwin GOARCH=amd64 go build -o bin/$(BINARY_NAME)-mac $(MAIN_FILE)
	@echo "✅ macOS build complete: bin/$(BINARY_NAME)-mac"

build-all: build-linux build-windows build-mac ## Build for all platforms
	@echo "✅ All platform builds complete"

# Migration commands
# Detect database URL for migration commands (check .env file first, then environment)
DB_URL := $(shell \
	if [ -f .env ] && grep -q "^DATABASE_URL=" .env; then \
		grep "^DATABASE_URL=" .env | cut -d '=' -f2- | sed 's/^"//;s/"$$//'; \
	elif [ -n "$$DATABASE_URL" ]; then \
		echo "$$DATABASE_URL"; \
	else \
		echo "sqlite3://tmp/api21.db"; \
	fi)

migrate-install: ## Install golang-migrate CLI tool
	@echo "📦 Installing golang-migrate CLI..."
	@go install -tags 'postgres sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	@echo "✅ golang-migrate CLI installed"

migration-create: ## Create a new migration file (usage: make migration-create name=create_users_table)
	@if [ -z "$(name)" ]; then \
		echo "❌ Error: name parameter is required"; \
		echo "Usage: make migration-create name=create_users_table"; \
		exit 1; \
	fi
	@echo "📝 Creating new migration: $(name)..."
	@migrate create -ext sql -dir migrations -seq $(name)
	@echo "✅ Migration files created in migrations/"

migrate-up: ## Run all pending migrations
	@echo "⬆️  Running pending migrations..."
	@if migrate -path migrations -database "$(DB_URL)" up; then \
		echo "✅ Migrations completed"; \
	elif [ $$? -eq 127 ]; then \
		echo "❌ migrate command not found. Installing golang-migrate CLI..."; \
		$(MAKE) migrate-install; \
		echo "🔄 Retrying migrations..."; \
		migrate -path migrations -database "$(DB_URL)" up; \
		echo "✅ Migrations completed"; \
	else \
		echo "❌ Migration failed with error code $$?"; \
		exit 1; \
	fi

migrate-down: ## Rollback last migration
	@echo "⬇️  Rolling back last migration..."
	@migrate -path migrations -database "$(DB_URL)" down 1
	@echo "✅ Migration rolled back"

migrate-down-all: ## Rollback all migrations
	@echo "⬇️  Rolling back all migrations..."
	@migrate -path migrations -database "$(DB_URL)" down
	@echo "✅ All migrations rolled back"

migrate-drop: ## Drop all tables and remove migration history  
	@echo "💥 Dropping all tables and migration history..."
	@read -p "Are you sure? This will delete ALL data! [y/N]: " confirm && [ "$$confirm" = "y" ]
	@migrate -path migrations -database "$(DB_URL)" drop
	@echo "✅ Database dropped"

migrate-version: ## Show current migration version
	@echo "📊 Current migration status:"
	@migrate -path migrations -database "$(DB_URL)" version

migrate-force: ## Force migration to specific version (usage: make migrate-force version=1)
	@if [ -z "$(version)" ]; then \
		echo "❌ Error: version parameter is required"; \
		echo "Usage: make migrate-force version=1"; \
		exit 1; \
	fi
	@echo "🔧 Forcing migration to version $(version)..."
	@migrate -path migrations -database "$(DB_URL)" force $(version)
	@echo "✅ Migration version forced to $(version)"

migrate-goto: ## Migrate to specific version (usage: make migrate-goto version=2)
	@if [ -z "$(version)" ]; then \
		echo "❌ Error: version parameter is required"; \
		echo "Usage: make migrate-goto version=2"; \
		exit 1; \
	fi
	@echo "🎯 Migrating to version $(version)..."
	@migrate -path migrations -database "$(DB_URL)" goto $(version)
	@echo "✅ Migrated to version $(version)"

# Docker / Compose helpers for local development
docker-up: ## Start Postgres service using docker compose
	@echo "🐳 Starting Postgres via docker compose..."
	@docker compose up -d db

docker-down: ## Stop and remove containers/volumes created by compose
	@echo "🛑 Stopping Postgres and removing volumes..."
	@docker compose down -v

docker-logs: ## Follow Postgres container logs
	@echo "📜 Attaching to db logs... (Ctrl-C to exit)"
	@docker compose logs -f db

docker-ps: ## Show `docker compose ps` for services
	@docker compose ps

db-url: ## Print example DATABASE_URL for local docker-compose Postgres
	@echo "postgres://api21:api21_password@localhost:5432/api21_dev?sslmode=disable"