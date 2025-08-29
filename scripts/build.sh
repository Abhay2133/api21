#!/bin/bash

# Build script for API21

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🏗️  Building API21...${NC}"

# Create bin directory if it doesn't exist
mkdir -p bin

# Get build info
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME=$(date -u '+%Y-%m-%d_%H:%M:%S')

# Build the application with version info
go build -ldflags="-X main.Version=${GIT_COMMIT} -X main.BuildTime=${BUILD_TIME}" -o bin/api21 cmd/server/main.go

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful! Binary created at bin/api21${NC}"
    echo -e "${GREEN}🚀 Run with: ./bin/api21${NC}"
    echo -e "${YELLOW}📝 Version: ${GIT_COMMIT}${NC}"
    echo -e "${YELLOW}🕒 Built at: ${BUILD_TIME}${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
