# Test Suite for API21

This directory contains the test suite for the API21 project, providing comprehensive unit and integration tests for all major components.

## Directory Structure

```
tests/
├── controllers/          # Integration tests for HTTP controllers
├── models/              # Unit tests for data models
├── utils/               # Test utilities and helpers
└── README.md           # This file
```

## Test Organization

### Model Tests (`tests/models/`)
- **user_test.go**: Tests for User model CRUD operations
- **clipboard_test.go**: Tests for Clipboard model CRUD operations

Tests cover:
- Model creation and validation
- Database CRUD operations
- Error handling for edge cases
- Constraint validation (unique email, duplicate titles)

### Controller Tests (`tests/controllers/`)
- **user_controller_test.go**: Integration tests for User API endpoints
- **clipboard_controller_test.go**: Integration tests for Clipboard API endpoints

Tests cover:
- HTTP request/response handling
- JSON serialization/deserialization
- Status code validation
- Error response handling
- Complete API endpoint functionality

### Test Utilities (`tests/utils/`)
- **test_helpers.go**: Common utilities for test setup and teardown

Provides:
- Test database setup and cleanup
- Table truncation utilities
- Test data creation helpers
- Environment configuration helpers

## Running Tests

### All Tests
```bash
make test
```

### Model Tests Only
```bash
make test-models
```

### Controller Tests Only
```bash
make test-controllers
```

### Coverage Report
```bash
make test-coverage
```
This generates an HTML coverage report at `coverage/coverage.html`.

### Individual Test Packages
```bash
# Models only
go test -v ./tests/models/

# Controllers only
go test -v ./tests/controllers/
```

### Watch Mode (with entr)
```bash
make test-watch
```
Automatically reruns tests when Go files change.

## Test Features

### Database Isolation
- Each test uses a fresh SQLite database in a temporary directory
- Tables are truncated between tests to ensure isolation
- Database connections are properly cleaned up

### Test Data Management
- Helper functions create consistent test data
- Tests are independent and don't rely on external state
- Automatic cleanup prevents test pollution

### Comprehensive Coverage
- **Models**: All CRUD operations, validation, constraints
- **Controllers**: All HTTP endpoints, error cases, status codes
- **Edge Cases**: Invalid inputs, not found scenarios, duplicate constraints

## Test Dependencies

The test suite uses these libraries:
- **testify/assert**: Fluent assertions
- **testify/suite**: Organized test suites for integration tests
- **Standard library**: httptest for HTTP testing

## Database Configuration

Tests use SQLite with:
- In-memory or temporary file databases
- Automatic schema migration
- Silent logging to avoid test output noise
- Proper connection cleanup

## Best Practices

1. **Isolation**: Each test is independent
2. **Cleanup**: Resources are properly cleaned up
3. **Descriptive Names**: Test names clearly describe scenarios
4. **Coverage**: Both success and error paths are tested
5. **Fast Execution**: Tests run quickly with minimal setup

## Adding New Tests

When adding new features:

1. **Models**: Add tests to appropriate `tests/models/*_test.go`
2. **Controllers**: Add tests to appropriate `tests/controllers/*_test.go`
3. **Utilities**: Update `tests/utils/test_helpers.go` if needed

Follow existing patterns:
- Use testify assertions
- Set up and clean up properly
- Test both success and error cases
- Use descriptive test names