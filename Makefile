.PHONY: help install migrate-up build start start-prod dev clean test

# Variables
BINARY_NAME=api21
PORT?=5000

help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make migrate-up   - Run database migrations"
	@echo "  make create-prod-db - Create production database if it doesn't exist"
	@echo "  make build        - Build production binary"
	@echo "  make start        - Install deps, migrate, create db, and run in production mode"
	@echo "  make start-prod   - Run already built binary in production mode"
	@echo "  make dev          - Run development server with hot-reload"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make test         - Run tests"

# Install dependencies
install:
	@echo "Installing dependencies..."
	go mod download
	go mod tidy

# Run database migrations
migrate-up:
	@echo "Running database migrations..."
	buffalo task db:migrate

# Create production database if it doesn't exist
create-prod-db:
	@echo "Creating production database if it doesn't exist..."
	@if [ -z "$$DATABASE_URL" ]; then \
		echo "DATABASE_URL not set, using default PostgreSQL connection..."; \
		PGPASSWORD=api21_password psql -h localhost -U api21 -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'api21_production'" | grep -q 1 || \
		PGPASSWORD=api21_password psql -h localhost -U api21 -d postgres -c "CREATE DATABASE api21_production"; \
	else \
		echo "Using custom DATABASE_URL"; \
	fi

# Build production binary
build: install
	@echo "Building production binary..."
	buffalo build -o bin/$(BINARY_NAME)

# Complete start command: install deps, migrate, and run in production mode
start: install migrate-up build create-prod-db
	@echo "Starting $(BINARY_NAME) in production mode on port $(PORT)..."
	export GO_ENV=production && \
	export ADDR=0.0.0.0 && \
	export PORT=$(PORT) && \
	./bin/$(BINARY_NAME)

# Start already built binary in production mode
start-prod:
	@echo "Starting $(BINARY_NAME) in production mode on port $(PORT)..."
	export GO_ENV=production && \
	export ADDR=0.0.0.0 && \
	export PORT=$(PORT) && \
	./bin/$(BINARY_NAME)

# Development server with hot-reload
dev:
	@echo "Starting development server..."
	./dev.sh

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	rm -rf tmp/
	go clean

# Run tests
test:
	@echo "Running tests..."
	buffalo test -v
