#!/bin/bash

# Setup script for API21 development environment

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 API21 Development Environment Setup${NC}"
echo -e "${YELLOW}Setting up your GoLang Fiber development environment...${NC}"
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go is not installed. Please install Go 1.21 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Go found: $(go version)${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing Go dependencies...${NC}"
go mod tidy

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Install development tools
echo -e "${YELLOW}🔧 Installing development tools...${NC}"

# Install Air for hot reload
echo -e "${YELLOW}Installing Air (hot reload)...${NC}"
go install github.com/air-verse/air@latest

# Install golangci-lint
echo -e "${YELLOW}Installing golangci-lint...${NC}"
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Install gofumpt for better formatting
echo -e "${YELLOW}Installing gofumpt...${NC}"
go install mvdan.cc/gofumpt@latest

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}💡 Please update .env with your configuration${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p bin tmp logs

# Make scripts executable
echo -e "${YELLOW}🔐 Making scripts executable...${NC}"
chmod +x run.sh
chmod +x scripts/*.sh

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}Available commands:${NC}"
echo -e "${YELLOW}  ./run.sh dev          ${NC}- Start development server with hot reload"
echo -e "${YELLOW}  ./run.sh build        ${NC}- Build the application"
echo -e "${YELLOW}  ./run.sh test         ${NC}- Run tests"
echo -e "${YELLOW}  make dev              ${NC}- Start development server (using Makefile)"
echo -e "${YELLOW}  make build            ${NC}- Build application (using Makefile)"
echo -e "${YELLOW}  make help             ${NC}- Show all available commands"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo -e "${YELLOW}  - README.md           ${NC}- Project documentation"
echo -e "${YELLOW}  - .env.example        ${NC}- Environment variables template"
echo -e "${YELLOW}  - Makefile            ${NC}- Build automation"
echo ""
echo -e "${GREEN}🚀 You're ready to start development!${NC}"
echo -e "${YELLOW}💡 Try: ./run.sh dev${NC}"
