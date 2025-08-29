#!/bin/bash

# Development script for API21 with hot reload

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 API21 Development Server${NC}"
echo -e "${YELLOW}Starting with hot reload...${NC}"

# Check if Air is installed
if ! command -v air &> /dev/null; then
    echo -e "${RED}Air not found. Installing...${NC}"
    go install github.com/air-verse/air@latest
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install Air${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Air installed successfully${NC}"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env file created from template${NC}"
        echo -e "${YELLOW}💡 Please update .env with your configuration${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
    fi
fi

# Start development server
echo -e "${GREEN}🎯 Starting development server on http://localhost:3000${NC}"
echo -e "${YELLOW}📝 Press Ctrl+C to stop${NC}"
echo ""

air
