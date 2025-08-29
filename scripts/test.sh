#!/bin/bash

# Test script for API21

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 API21 Test Suite${NC}"

# Function to run tests
run_tests() {
    echo -e "${YELLOW}Running unit tests...${NC}"
    go test -v ./internal/... ./pkg/...
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Unit tests passed!${NC}"
    else
        echo -e "${RED}❌ Some unit tests failed!${NC}"
        exit 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    echo -e "${YELLOW}Running integration tests...${NC}"
    go test -v ./tests/...
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Integration tests passed!${NC}"
    else
        echo -e "${RED}❌ Some integration tests failed!${NC}"
        exit 1
    fi
}

# Function to run all tests
run_all_tests() {
    echo -e "${YELLOW}Running all tests (unit + integration)...${NC}"
    run_tests
    run_integration_tests
    echo -e "${GREEN}✅ All tests completed!${NC}"
}

# Function to run tests with coverage
run_coverage() {
    echo -e "${YELLOW}Running tests with coverage...${NC}"
    go test -v -coverprofile=coverage.out ./internal/... ./pkg/... ./tests/...
    
    if [ $? -eq 0 ]; then
        go tool cover -html=coverage.out -o coverage.html
        echo -e "${GREEN}✅ Tests completed with coverage!${NC}"
        echo -e "${YELLOW}📊 Coverage report: coverage.html${NC}"
        
        # Show coverage percentage
        go tool cover -func=coverage.out | tail -1
    else
        echo -e "${RED}❌ Tests failed!${NC}"
        exit 1
    fi
}

# Function to run benchmarks
run_benchmarks() {
    echo -e "${YELLOW}Running benchmarks...${NC}"
    go test -bench=. -benchmem ./internal/... ./pkg/...
}

# Check command line arguments
case "${1:-test}" in
    "test")
        run_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "coverage")
        run_coverage
        ;;
    "bench")
        run_benchmarks
        ;;
    "all")
        run_all_tests
        run_coverage
        run_benchmarks
        ;;
    *)
        echo -e "${RED}Unknown test command: $1${NC}"
        echo -e "${YELLOW}Usage: $0 [test|integration|coverage|bench|all]${NC}"
        exit 1
        ;;
esac
