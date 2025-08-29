#!/bin/bash

# API21 Script Runner - Similar to npm run scripts

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show available scripts
show_help() {
    echo -e "${BLUE}API21 Script Runner${NC}"
    echo -e "${YELLOW}Usage: ./run.sh <script>${NC}"
    echo ""
    echo -e "${GREEN}Available scripts:${NC}"
    echo "  dev          - Start development server with hot reload"
    echo "  start        - Start production server"
    echo "  build        - Build the application"
    echo "  test         - Run tests"
    echo "  lint         - Run linter"
    echo "  fmt          - Format code"
    echo "  clean        - Clean build artifacts"
    echo "  setup        - Setup development environment"
    echo "  migrate      - Run database migrations"
    echo "  install-deps - Install all dependencies"
    echo "  docker:build - Build Docker image"
    echo "  docker:run   - Run Docker container"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./run.sh dev"
    echo "  ./run.sh build"
    echo "  ./run.sh test"
}

# Check if script argument is provided
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

SCRIPT=$1

case $SCRIPT in
    "dev")
        echo -e "${YELLOW}🚀 Starting development server...${NC}"
        if command -v air > /dev/null; then
            air
        else
            echo -e "${RED}Air not found. Installing...${NC}"
            go install github.com/air-verse/air@latest
            air
        fi
        ;;
    
    "start")
        echo -e "${YELLOW}🚀 Starting production server...${NC}"
        go run cmd/server/main.go
        ;;
    
    "build")
        echo -e "${YELLOW}🏗️  Building application...${NC}"
        mkdir -p bin
        go build -o bin/api21 cmd/server/main.go
        echo -e "${GREEN}✅ Build completed: bin/api21${NC}"
        ;;
    
    "test")
        echo -e "${YELLOW}🧪 Running tests...${NC}"
        go test -v ./...
        ;;
    
    "test:coverage")
        echo -e "${YELLOW}🧪 Running tests with coverage...${NC}"
        go test -v -coverprofile=coverage.out ./...
        go tool cover -html=coverage.out -o coverage.html
        echo -e "${GREEN}📊 Coverage report: coverage.html${NC}"
        ;;
    
    "lint")
        echo -e "${YELLOW}🔍 Running linter...${NC}"
        if command -v golangci-lint > /dev/null; then
            golangci-lint run
        else
            echo -e "${RED}golangci-lint not found. Install: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest${NC}"
        fi
        ;;
    
    "fmt")
        echo -e "${YELLOW}✨ Formatting code...${NC}"
        go fmt ./...
        echo -e "${GREEN}✅ Code formatted${NC}"
        ;;
    
    "clean")
        echo -e "${YELLOW}🧹 Cleaning build artifacts...${NC}"
        rm -rf bin tmp coverage.out coverage.html
        echo -e "${GREEN}✅ Clean completed${NC}"
        ;;
    
    "setup")
        echo -e "${YELLOW}⚙️  Setting up development environment...${NC}"
        go mod tidy
        cp .env.example .env 2>/dev/null || echo "Note: .env.example not found or .env already exists"
        go install github.com/air-verse/air@latest
        go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
        echo -e "${GREEN}✅ Setup completed${NC}"
        echo -e "${YELLOW}💡 Don't forget to update your .env file!${NC}"
        ;;
    
    "migrate")
        echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
        go run cmd/server/main.go -migrate
        ;;
    
    "install-deps"|"deps")
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        go mod tidy
        echo -e "${GREEN}✅ Dependencies installed${NC}"
        ;;
    
    "docker:build")
        echo -e "${YELLOW}🐳 Building Docker image...${NC}"
        docker build -t api21:latest .
        echo -e "${GREEN}✅ Docker image built${NC}"
        ;;
    
    "docker:run")
        echo -e "${YELLOW}🐳 Running Docker container...${NC}"
        docker run -p 3000:3000 --env-file .env api21:latest
        ;;
    
    "help"|"--help"|"-h")
        show_help
        ;;
    
    *)
        echo -e "${RED}❌ Unknown script: $SCRIPT${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
