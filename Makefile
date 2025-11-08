.PHONY: help install migrate-up build start start-prod dev clean test

# Variables
BINARY_NAME=api21
PORT?=5000

help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make migrate-up   - Run database migrations"
	@echo "  make build        - Build production binary"
	@echo "  make start        - Install deps, migrate, and run in production mode"
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
	buffalo pop migrate up

# Build production binary
build: install
	@echo "Building production binary..."
	buffalo build -o bin/$(BINARY_NAME)

# Complete start command: install deps, migrate, and run in production mode
start: install migrate-up build
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
