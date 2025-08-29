# API21 Test Suite Documentation

## Overview
This document provides a comprehensive overview of the test suite for the API21 GoLang Fiber project. All tests have been consolidated in the `./tests/` directory as requested.

## Test Structure
```
tests/
├── config_test.go         # Configuration management tests
├── handlers_test.go       # HTTP handler tests
├── helpers.go            # Test helper functions
├── integration_test.go   # End-to-end integration tests
├── middleware_test.go    # Middleware functionality tests
├── models_test.go        # Data model tests
├── routes_test.go        # Route configuration tests
└── utils_test.go         # Utility function tests
```

## Test Categories

### 1. Unit Tests
- **Config Tests** (`config_test.go`): Tests environment variable loading, default values, and configuration struct initialization
- **Models Tests** (`models_test.go`): Tests data model structs (User, Item, APIResponse, PaginationMeta) and relationships
- **Utils Tests** (`utils_test.go`): Tests utility functions like password hashing, email validation, string sanitization, and pagination calculation
- **Handlers Tests** (`handlers_test.go`): Tests HTTP handlers for users and items endpoints with various scenarios
- **Middleware Tests** (`middleware_test.go`): Tests custom middleware including auth, rate limiting, request ID, and API key validation
- **Routes Tests** (`routes_test.go`): Tests route setup, parameter extraction, and HTTP method validation

### 2. Integration Tests
- **Integration Test Suite** (`integration_test.go`): Comprehensive end-to-end tests including:
  - API versioning
  - CORS middleware
  - Concurrent request handling
  - Content type handling
  - Error handling
  - Health endpoints
  - Complete user and item workflows

## Test Coverage
The test suite covers:
- ✅ Configuration management
- ✅ HTTP handlers and routes
- ✅ Middleware functionality
- ✅ Data models and relationships
- ✅ Utility functions
- ✅ Integration workflows
- ✅ Error handling scenarios
- ✅ Concurrent request handling

## Running Tests

### Run All Tests
```bash
go test ./tests/... -v
```

### Run Specific Test File
```bash
go test ./tests/config_test.go -v
go test ./tests/handlers_test.go -v
# etc.
```

### Run Tests with Coverage
```bash
go test ./tests/... -v -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

### Run Integration Tests Only
```bash
go test ./tests/integration_test.go -v
```

### Run Benchmarks
```bash
go test ./tests/... -bench=.
```

## Test Status

### ✅ Passing Tests (95%+)
- Configuration loading and management
- HTTP handlers (GET, POST, PUT, DELETE)
- Data model operations
- Most utility functions
- Route setup and parameter extraction
- Integration workflows
- Middleware chaining

### ⚠️ Known Issues (3 failing tests)
1. **RequestID Middleware**: Request ID generation may return binary data instead of string
2. **Route Method Validation**: OPTIONS requests not returning expected 405 status (CORS related)
3. **SanitizeString Function**: HTML tag removal not working as expected

## Test Helpers
The `helpers.go` file contains shared test utilities:
- Common test setup functions
- Mock data generators
- Test assertion helpers
- Database test utilities (when needed)

## Best Practices Implemented
- **Table-driven tests**: For testing multiple scenarios efficiently
- **Subtests**: For organized test output and selective running
- **Benchmark tests**: For performance testing critical functions
- **Integration tests**: For end-to-end workflow validation
- **Error case testing**: Comprehensive error scenario coverage
- **Mock testing**: For external dependencies
- **Clean test structure**: Organized by functionality

## Makefile Integration
The test suite is integrated with the project's Makefile:
```bash
make test          # Run all tests
make test-coverage # Run tests with coverage
make test-integration # Run integration tests only
make lint          # Run linter (includes test files)
```

## Continuous Integration
Tests are configured to run in CI/CD pipelines with:
- Go version matrix testing
- Code coverage reporting
- Benchmark comparisons
- Linting and formatting checks

## Contributing to Tests
When adding new features:
1. Add corresponding tests in the appropriate `*_test.go` file
2. Follow the existing naming conventions
3. Include both positive and negative test cases
4. Add integration tests for user-facing features
5. Update this documentation as needed

## Framework Dependencies
- **testify/assert**: For test assertions
- **testify/suite**: For integration test suites
- **Fiber**: For HTTP testing with `app.Test()`
- **httptest**: For HTTP request/response testing

## Notes
- All tests use the `tests` package to avoid import cycles
- Tests import from `api21/internal/*` and `api21/pkg/*` packages
- Environment variables are properly isolated in tests
- Database tests use transaction rollback for clean state
- Concurrent tests use goroutines to verify thread safety
